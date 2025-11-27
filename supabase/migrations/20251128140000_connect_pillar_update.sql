-- 1. UPGRADE PROJECTS TABLE
-- Add new fields to support the enhanced project details
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Tech',
ADD COLUMN IF NOT EXISTS duration TEXT,
ADD COLUMN IF NOT EXISTS team_size INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS banner_url TEXT,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS allow_direct_join BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- 2. CREATE PROJECT ROLES TABLE
-- Stores the specific positions a project is hiring for (e.g., "Frontend Dev")
CREATE TABLE IF NOT EXISTS public.project_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  openings INTEGER DEFAULT 1,
  skills_required TEXT[] DEFAULT '{}',
  experience_level TEXT DEFAULT 'Beginner', -- Beginner, Intermediate, Advanced
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CREATE APPLICATIONS TABLE
-- Stores user applications for specific roles
CREATE TABLE IF NOT EXISTS public.project_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  role_id UUID REFERENCES public.project_roles(id) ON DELETE SET NULL,
  applicant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  message TEXT,
  portfolio_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CREATE DISCUSSIONS TABLE (Threads)
-- Main topics/threads inside a project
CREATE TABLE IF NOT EXISTS public.project_discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. CREATE DISCUSSION POSTS TABLE (Replies)
-- Individual replies within a discussion thread
CREATE TABLE IF NOT EXISTS public.project_discussion_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID REFERENCES public.project_discussions(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. CREATE RESOURCES TABLE
-- File uploads and links shared within the project
CREATE TABLE IF NOT EXISTS public.project_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  uploader_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  resource_type TEXT DEFAULT 'file', -- file, link
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. CREATE UPDATES TABLE (Announcements)
-- Updates posted by the project host
CREATE TABLE IF NOT EXISTS public.project_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. CREATE BOOKMARKS TABLE
-- Allows users to save projects they are interested in
CREATE TABLE IF NOT EXISTS public.bookmarks_projects (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, project_id)
);

-- 9. ENABLE ROW LEVEL SECURITY (RLS)
-- Secure all new tables by default
ALTER TABLE public.project_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_discussion_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks_projects ENABLE ROW LEVEL SECURITY;

-- 10. DEFINE SECURITY POLICIES
-- Roles: Everyone can view, only hosts can edit
CREATE POLICY "Public read roles" ON public.project_roles FOR SELECT USING (true);
CREATE POLICY "Host edit roles" ON public.project_roles FOR ALL USING (auth.uid() IN (SELECT host_id FROM public.projects WHERE id = project_id));

-- Discussions: Everyone can view, authenticated users can create
CREATE POLICY "Public read discussions" ON public.project_discussions FOR SELECT USING (true);
CREATE POLICY "Auth create discussions" ON public.project_discussions FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Discussion Posts: Everyone can view, authenticated users can create
CREATE POLICY "Public read posts" ON public.project_discussion_posts FOR SELECT USING (true);
CREATE POLICY "Auth create posts" ON public.project_discussion_posts FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Applications: Users can see/manage their own applications OR if they are the project host
CREATE POLICY "Users manage applications" ON public.project_applications FOR ALL USING (auth.uid() = applicant_id OR auth.uid() IN (SELECT host_id FROM public.projects WHERE id = project_id));

-- Bookmarks: Users can only manage their own bookmarks
CREATE POLICY "Users manage bookmarks" ON public.bookmarks_projects FOR ALL USING (auth.uid() = user_id);

-- Resources: Project members can view, Hosts can manage
CREATE POLICY "Members read resources" ON public.project_resources FOR SELECT USING (EXISTS (SELECT 1 FROM public.project_members WHERE project_id = project_resources.project_id AND user_id = auth.uid()));
CREATE POLICY "Hosts manage resources" ON public.project_resources FOR ALL USING (auth.uid() IN (SELECT host_id FROM public.projects WHERE id = project_id));

-- Updates: Public read, Host write
CREATE POLICY "Public read updates" ON public.project_updates FOR SELECT USING (true);
CREATE POLICY "Hosts manage updates" ON public.project_updates FOR ALL USING (auth.uid() IN (SELECT host_id FROM public.projects WHERE id = project_id));
