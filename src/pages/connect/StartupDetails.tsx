import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Share2, Bookmark, Rocket, CheckCircle2 } from "lucide-react";

const StartupDetails = () => {
  const { startupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [startup, setStartup] = useState<any>(null);
  const [roles, setRoles] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [hasApplied, setHasApplied] = useState(false);
  const [applicationMsg, setApplicationMsg] = useState("");

  useEffect(() => {
    if (startupId) fetchStartupData();
  }, [startupId, user]);

  const fetchStartupData = async () => {
    const { data: st } = await supabase
      .from('startups')
      .select('*, founder:profiles!startups_founder_id_fkey(*)')
      .eq('id', startupId)
      .single();
    setStartup(st);

    const { data: r } = await supabase.from('startup_roles').select('*').eq('startup_id', startupId);
    setRoles(r || []);

    const { data: m } = await supabase
      .from('startup_members')
      .select('*, profile:profiles(*)')
      .eq('startup_id', startupId);
    setMembers(m || []);

    if (user) {
      const { data: app } = await supabase.from('startup_applications').select('id').eq('startup_id', startupId).eq('applicant_id', user.id).single();
      setHasApplied(!!app);
    }
  };

  const handleApply = async (roleId: string) => {
    if (!user) return navigate('/auth');
    const { error } = await supabase.from('startup_applications').insert({
      startup_id: startupId,
      role_id: roleId,
      applicant_id: user.id,
      message: applicationMsg
    });

    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Applied!", description: "Application sent to founder." });
      setHasApplied(true);
    }
  };

  if (!startup) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <div className="bg-muted/30 border-b">
        <div className="container mx-auto px-6 py-8">
          <Button variant="ghost" onClick={() => navigate('/connect')} className="mb-4 pl-0">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Connect
          </Button>
          
          <div className="flex flex-col md:flex-row justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-2">
                {startup.name} <Badge variant="outline">{startup.stage}</Badge>
              </h1>
              <p className="text-muted-foreground max-w-2xl">{startup.description}</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline"><Bookmark className="mr-2 h-4 w-4"/> Save</Button>
              <Button variant="outline"><Share2 className="mr-2 h-4 w-4"/> Share</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-8">
            <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-0 py-3">Overview</TabsTrigger>
            <TabsTrigger value="roles" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-0 py-3">Roles</TabsTrigger>
            <TabsTrigger value="members" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-0 py-3">Team</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-8">
            <Card>
              <CardHeader><CardTitle>About the Startup</CardTitle></CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{startup.description}</p>
                <div className="mt-6 flex items-center gap-3">
                  <Avatar><AvatarFallback>FD</AvatarFallback></Avatar>
                  <div>
                    <p className="font-medium">{startup.founder?.full_name}</p>
                    <p className="text-xs text-muted-foreground">Founder</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roles" className="mt-8">
            <div className="grid gap-4">
              {roles.map(role => (
                <Card key={role.id}>
                  <CardHeader>
                    <div className="flex justify-between">
                      <div>
                        <CardTitle>{role.title}</CardTitle>
                        <Badge className="mt-2 bg-primary/20 text-primary hover:bg-primary/30">{role.role_type}</Badge>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button disabled={hasApplied}>{hasApplied ? "Applied" : "Apply"}</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Apply for {role.title}</DialogTitle></DialogHeader>
                          <div className="space-y-4 pt-4">
                            <Textarea placeholder="Why do you want to join?" onChange={(e) => setApplicationMsg(e.target.value)} />
                            <Button className="w-full" onClick={() => handleApply(role.id)}>Send Application</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">{role.description}</p>
                    <p className="text-xs font-mono bg-muted p-2 rounded inline-block">Equity: {role.equity_range || "Negotiable"}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="members" className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {members.map(m => (
                <Card key={m.id} className="p-4 flex items-center gap-4">
                  <Avatar><AvatarFallback>{m.profile?.full_name?.[0]}</AvatarFallback></Avatar>
                  <div>
                    <p className="font-bold">{m.profile?.full_name}</p>
                    <p className="text-xs text-muted-foreground">{m.role}</p>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StartupDetails;
