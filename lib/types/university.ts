export type ForeignStudentUniversity = {
  id: string;
  baseYear: number;
  universityName: string;
  campusName?: string;
  universityType?: string;
  sido?: string;
  sigungu?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  nationality?: string;
  degreeCourse?: string;
  studentCount: number;
  sourceName?: string;
  sourceUrl?: string;
};

export type UniversityOpportunity = ForeignStudentUniversity & {
  totalForeignStudents: number;
  topNationalities: string[];
  nearbyResidentCount: number;
  opportunityScore: number;
  recommendedCampaign: string;
};
