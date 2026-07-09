// types/42.ts

export interface FortyTwoUser {
  id: number;
  email: string;
  login: string;
  first_name: string;
  last_name: string;
  usual_full_name: string;
  usual_first_name: string;

  displayname: string;
  kind: 'student' | (string & {});

  image: FortyTwoImage;

  staff: boolean;
  correction_point: number;

  wallet: number;

  location: string | null;

  active: boolean;
  alumni: boolean;

  created_at: string;
  updated_at: string;

  cursus_users: CursusUser[];
  projects_users: ProjectUser[];

  achievements: Achievement[];

  campus: Campus[];
  campus_users: CampusUser[];

  languages_users: LanguageUser[];

  titles: unknown[];
  titles_users: unknown[];
}

export interface FortyTwoImage {
  link: string;

  versions: {
    large: string;
    medium: string;
    small: string;
    micro: string;
  };
}

export interface CursusUser {
  id: number;

  begin_at: string;
  end_at: string | null;

  grade: string | null;

  level: number;

  cursus_id: number;

  has_coalition: boolean;

  blackholed_at: string | null;

  skills: Skill[];

  cursus: Cursus;
}

export interface Skill {
  id: number;
  name: string;
  level: number;
}

export interface Cursus {
  id: number;

  name: string;
  slug: string;

  kind: 'main' | 'piscine' | 'piscine_community' | (string & {});
}

export interface ProjectUser {
  id: number;

  occurrence: number;

  final_mark: number | null;

  status: 'finished' | 'in_progress' | 'waiting_for_correction' | (string & {});

  validated: boolean | null;

  current_team_id: number | null;

  project: Project;

  marked_at: string | null;

  marked: boolean;

  created_at: string;

  updated_at: string;
}

export interface Project {
  id: number;

  name: string;

  slug: string;

  parent_id: number | null;
}

export interface Achievement {
  id: number;

  name: string;

  description: string;

  tier: 'none' | 'easy' | 'medium' | 'hard' | (string & {});

  kind: 'project' | 'scolarity' | 'pedagogy' | 'social' | (string & {});

  visible: boolean;

  image: string;

  nbr_of_success: number | null;

  users_url: string;
}

export interface Campus {
  id: number;

  name: string;

  country: string;

  city: string;

  time_zone: string;

  website: string;

  users_count: number;
}

export interface CampusUser {
  id: number;

  user_id: number;

  campus_id: number;

  is_primary: boolean;
}

export interface LanguageUser {
  id: number;

  language_id: number;

  user_id: number;

  position: number;
}
