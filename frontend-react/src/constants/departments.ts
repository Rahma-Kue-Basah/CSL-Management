const DEPARTMENT_VALUES = [
  "Accounting",
  "Business",
  "Event",
  "Finance & Banking",
  "Branding",
  "Renewable Energy Engineering",
  "Digital Business Technology",
  "Computer Systems Engineering",
  "Business Economics",
  "Hospitality Business",
  "International Business Law",
  "Artificial Inteligence and Robotic",
  "Business Mathematics",
  "Food Business Technology",
  "Product Design Innovation",
  "Energy Business and Technology",
  "Hukum Bisnis Internasional",
  "S2 Manajemen Pemasaran dan Keuangan",
  "S2 Bisnis Analitik Terapan",
  "S2 Inovasi Bisnis Baru",
  "S2 Manajemen Bisnis",
  "S2 Manajemen Stratejik",
  "S3 Manajemen dan Kewirausahaan",
  "Lainnya",
];

const DEPARTMENT_OPTIONS = DEPARTMENT_VALUES.map((value) => ({
  value,
  label: value,
}));

export { DEPARTMENT_VALUES, DEPARTMENT_OPTIONS };
