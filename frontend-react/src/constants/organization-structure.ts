export type OrganizationStructureItem = {
  id: string;
  title: string;
  name: string;
  parent: string | null;
};

// Ubah isi array ini untuk mengelola struktur organisasi langsung dari frontend.
export const ORGANIZATION_STRUCTURE_ITEMS: OrganizationStructureItem[] = [
  {
    id: "head-lab",
    title: "Kepala Laboratorium",
    name: "Nama Kepala Laboratorium",
    parent: null,
  },
  {
    id: "admin-lab",
    title: "Koordinator Administrasi",
    name: "Nama Koordinator Administrasi",
    parent: "head-lab",
  },
  {
    id: "tech-lab",
    title: "Koordinator Teknis",
    name: "Nama Koordinator Teknis",
    parent: "head-lab",
  },
  {
    id: "assistant-1",
    title: "Laboran",
    name: "Nama Laboran 1",
    parent: "tech-lab",
  },
  {
    id: "assistant-2",
    title: "Laboran",
    name: "Nama Laboran 2",
    parent: "tech-lab",
  },
];
