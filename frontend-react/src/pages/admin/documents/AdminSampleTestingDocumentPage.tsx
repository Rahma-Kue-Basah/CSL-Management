import AdminSampleTestingDocumentsPage from "@/components/admin/documents/AdminSampleTestingDocumentsPage";

export default function AdminSampleTestingDocumentPage() {
  return (
    <AdminSampleTestingDocumentsPage
      config={{
        title: "Dokumen Pengujian Sampel",
        description:
          "Lihat seluruh dokumen pengujian sampel dalam satu tabel admin.",
        documentTypes: [
          "testing_agreement",
          "signed_testing_agreement",
          "invoice",
          "payment_proof",
          "test_result_letter",
        ],
        emptyMessage: "Belum ada dokumen pengujian sampel yang tersedia.",
      }}
    />
  );
}
