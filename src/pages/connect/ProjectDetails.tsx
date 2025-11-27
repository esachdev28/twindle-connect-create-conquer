import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { 
  ArrowLeft, Share2, Bookmark, Users, Briefcase, 
  MessageSquare, FileText, Bell, Plus, CheckCircle2, Download 
} from "lucide-react";

const ProjectDetails = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [project, setProject] = useState<any>(null);
  const [roles, setRoles] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [updates, setUpdates] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  // Form States
  const [applicationMsg, setApplicationMsg] = useState("");
  const [newThread, setNewThread] = useState({ title: "", content: "" });
  const [newUpdate, setNewUpdate] = useState({ title: "", content: "" });
  const [newResource, setNewResource] = useState({ title: "", url: "" });

  useEffect(() => {
    if (projectId) {
      fetchProjectData();
    }
  }, [projectId, user]);

  const fetchProjectData = async () => {
    // 1. Fetch Project Info
    const { data: proj } = await supabase
      .from('projects')
      .select('*, host:profiles!projects_host_id_fkey(*)')
      .eq('id', projectId)
      .single();
    
    if (proj) {
      setProject(proj);
      setIsHost(user?.id === proj.host_id);
    }

    // 2. Fetch Roles
    const { data: rolesData } = await supabase.from('project_roles').select('*').eq('project_id', projectId);
    if (rolesData) setRoles(rolesData);

    // 3. Fetch Members
    const { data: membersData } = await supabase
      .from('project_members')
      .select('*, profile:profiles(*)')
      .eq('project_id', projectId);
    if (membersData) setMembers(membersData);

    // 4. Fetch Discussions
    const { data: discData } = await supabase
      .from('project_discussions')
      .select('*, author:profiles(full_name)')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (discData) setDiscussions(discData);

    // 5. Fetch Updates
    const { data: updatesData } = await supabase
      .from('project_updates')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (updatesData) setUpdates(updatesData);

    // 6. Fetch Resources
    const { data: resData } = await supabase.from('project_resources').select('*').eq('project_id', projectId);
    if (resData) setResources(resData);

    // 7. Check Application Status
    if (user) {
      const { data: app } = await supabase
        .from('project_applications')
        .select('id')
        .eq('project_id', projectId)
        .eq('applicant_id', user.id)
        .single();
      setHasApplied(!!app);
    }
  };

  const handleApply = async (roleId: string) => {
    if (!user) return navigate('/auth');
    
    const { error } = await supabase.from('project_applications').insert({
      project_id: projectId,
      role_id: roleId,
      applicant_id: user.id,
      message: applicationMsg
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Applied!", description: "Your application has been sent." });
      setHasApplied(true);
    }
  };

  const createDiscussion = async () => {
    if (!user) return;
    const { error } = await supabase.from('project_discussions').insert({
      project_id: projectId,
      author_id: user.id,
      title: newThread.title,
      content: newThread.content
    });

    if (!error) {
      toast({ title: "Posted", description: "Discussion thread created." });
      setNewThread({ title: "", content: "" });
      fetchProjectData();
    }
  };

  const postUpdate = async () => {
    if (!isHost) return;
    const { error } = await supabase.from('project_updates').insert({
      project_id: projectId,
      author_id: user?.id,
      title: newUpdate.title,
      content: newUpdate.content
    });

    if (!error) {
      toast({ title: "Posted", description: "Update published to members." });
      setNewUpdate({ title: "", content: "" });
      fetchProjectData();
    }
  };

  const addResource = async () => {
    if (!isHost) return;
    const { error } = await supabase.from('project_resources').insert({
      project_id: projectId,
      uploader_id: user?.id,
      title: newResource.title,
      file_url: newResource.url,
      resource_type: 'link'
    });

    if (!error) {
      toast({ title: "Added", description: "Resource added successfully." });
      setNewResource({ title: "", url: "" });
      fetchProjectData();
    }
  };

  if (!project) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      
      {/* 3.1 HEADER SECTION */}
      <div className="bg-muted/30 border-b">
        <div className="container mx-auto px-6 py-8">
          <Button variant="ghost" onClick={() => navigate('/connect')} className="mb-4 pl-0 hover:bg-transparent hover:underline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Discover
          </Button>
          
          <div className="flex flex-col md:flex-row justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-primary">{project.title}</h1>
                {project.status === 'open' && <Badge className="bg-green-500">Hiring</Badge>}
              </div>
              <div className="flex flex-wrap gap-4 items-center text-sm text-muted-foreground">
                <Badge variant="outline">{project.category}</Badge>
                <span className="flex items-center gap-1"><Users className="h-4 w-4"/> {members.length} / {project.team_size} Team Size</span>
                <span className="flex items-center gap-1"><Briefcase className="h-4 w-4"/> {project.duration}</span>
                <span>• Hosted by {project.host?.full_name}</span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline"><Bookmark className="mr-2 h-4 w-4"/> Save</Button>
              <Button variant="outline"><Share2 className="mr-2 h-4 w-4"/> Share</Button>
              {isHost ? (
                <Button onClick={() => navigate(`/connect/projects/${projectId}/applications`)}>Manage Applicants</Button>
              ) : hasApplied ? (
                <Button disabled variant="secondary"><CheckCircle2 className="mr-2 h-4 w-4"/> Applied</Button>
              ) : (
                <Button>Apply Now</Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3.2 TABS SECTION */}
      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-8 overflow-x-auto">
            {["Overview", "Roles", "Discussions", "Members", "Resources", "Updates"].map(tab => (
              <TabsTrigger 
                key={tab} 
                value={tab.toLowerCase()}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 text-muted-foreground data-[state=active]:text-foreground transition-all"
              >
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <Card>
                  <CardHeader><CardTitle>Project Description</CardTitle></CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">{project.description}</p>
                  </CardContent>
                </Card>
              </div>
              <div className="space-y-6">
                <Card>
                  <CardHeader><CardTitle>Project Lead</CardTitle></CardHeader>
                  <CardContent className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>{project.host?.full_name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-lg">{project.host?.full_name}</p>
                      <p className="text-xs text-muted-foreground">Owner</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ROLES TAB */}
          <TabsContent value="roles" className="mt-8">
            <div className="grid gap-4">
              {roles.length === 0 ? <p className="text-muted-foreground">No open roles at the moment.</p> : roles.map(role => (
                <Card key={role.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{role.title}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{role.description}</p>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button disabled={hasApplied || isHost}>
                            {hasApplied ? "Applied" : "Apply"}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Apply for {role.title}</DialogTitle></DialogHeader>
                          <div className="space-y-4 pt-4">
                            <Textarea 
                              placeholder="Why are you a good fit for this role?" 
                              value={applicationMsg}
                              onChange={(e) => setApplicationMsg(e.target.value)}
                            />
                            <Button className="w-full" onClick={() => handleApply(role.id)}>Submit Application</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <Badge variant="secondary">{role.experience_level}</Badge>
                      <span className="text-muted-foreground">Skills: {role.skills_required?.join(", ")}</span>
                      <span className="text-muted-foreground">{role.openings} Openings</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* DISCUSSIONS TAB */}
          <TabsContent value="discussions" className="mt-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Discussions</h2>
              <Dialog>
                <DialogTrigger asChild><Button><MessageSquare className="mr-2 h-4 w-4"/> New Thread</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Start a Discussion</DialogTitle></DialogHeader>
                  <div className="space-y-4 pt-4">
                    <Input placeholder="Thread Title" value={newThread.title} onChange={e => setNewThread({...newThread, title: e.target.value})} />
                    <Textarea placeholder="What's on your mind?" value={newThread.content} onChange={e => setNewThread({...newThread, content: e.target.value})} />
                    <Button className="w-full" onClick={createDiscussion}>Post Thread</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="space-y-4">
              {discussions.map(disc => (
                <Card key={disc.id} className="hover:bg-muted/20 transition-colors cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-lg">{disc.title}</CardTitle>
                    <div className="text-xs text-muted-foreground flex gap-2">
                      <span>by {disc.author?.full_name}</span>
                      <span>• {new Date(disc.created_at).toLocaleDateString()}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground line-clamp-2">{disc.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* MEMBERS TAB */}
          <TabsContent value="members" className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {members.map(member => (
                <Card key={member.id}>
                  <CardContent className="flex items-center gap-4 pt-6">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>{member.profile?.full_name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold">{member.profile?.full_name}</p>
                      <Badge variant="outline" className="mt-1 capitalize">{member.participation_type}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* UPDATES TAB */}
          <TabsContent value="updates" className="mt-8">
            {isHost && (
              <Card className="mb-8 border-dashed">
                <CardHeader><CardTitle>Post an Update</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <Input placeholder="Update Title" value={newUpdate.title} onChange={e => setNewUpdate({...newUpdate, title: e.target.value})} />
                  <Textarea placeholder="Share progress with your team..." value={newUpdate.content} onChange={e => setNewUpdate({...newUpdate, content: e.target.value})} />
                  <Button onClick={postUpdate}><Bell className="mr-2 h-4 w-4"/> Publish Update</Button>
                </CardContent>
              </Card>
            )}
            
            <div className="relative border-l-2 border-muted ml-4 space-y-8 pl-8 py-4">
              {updates.map(update => (
                <div key={update.id} className="relative">
                  <span className="absolute -left-[41px] top-1 h-5 w-5 rounded-full border-4 border-background bg-primary" />
                  <h3 className="text-lg font-bold">{update.title}</h3>
                  <p className="text-xs text-muted-foreground mb-2">{new Date(update.created_at).toLocaleDateString()}</p>
                  <p className="text-muted-foreground">{update.content}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* RESOURCES TAB */}
          <TabsContent value="resources" className="mt-8">
            {isHost && (
              <div className="flex gap-2 mb-6">
                <Input placeholder="Resource Title" value={newResource.title} onChange={e => setNewResource({...newResource, title: e.target.value})} />
                <Input placeholder="Link URL" value={newResource.url} onChange={e => setNewResource({...newResource, url: e.target.value})} />
                <Button onClick={addResource}><Plus className="mr-2 h-4 w-4"/> Add</Button>
              </div>
            )}
            
            <div className="grid gap-4">
              {resources.map(res => (
                <Card key={res.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-primary/10 rounded flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary"/>
                    </div>
                    <div>
                      <p className="font-medium">{res.title}</p>
                      <p className="text-xs text-muted-foreground">Added {new Date(res.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => window.open(res.file_url, '_blank')}>
                    <Download className="h-4 w-4" />
                  </Button>
                </Card>
              ))}
            </div>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
};

export default ProjectDetails;
