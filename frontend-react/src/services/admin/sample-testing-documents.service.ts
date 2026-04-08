import { API_PENGUJIAN_DOCUMENTS } from "@/constants/api";
import { authFetch } from "@/lib/auth/fetch";
import type {
  SampleTestingDocument,
  SampleTestingDocumentType,
} from "@/hooks/sample-testing/use-sample-testing";

export type AdminSampleTestingDocumentGroup = {
  sampleTestingId: string | number;
  code: string;
  requesterId: string;
  requesterName: string;
  requesterDepartment: string;
  institution: string;
  status: string;
  documents: SampleTestingDocument[];
};

type ApiDocumentRow = {
  id?: string | number | null;
  document_type?: SampleTestingDocumentType | null;
  document_label?: string | null;
  original_name?: string | null;
  mime_type?: string | null;
  size?: number | null;
  url?: string | null;
  uploaded_by?: string | number | null;
  uploaded_by_name?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type ApiDocumentGroup = {
  pengujian_id?: string | number | null;
  pengujian_code?: string | null;
  pengujian_status?: string | null;
  requester_id?: string | number | null;
  requester_name?: string | null;
  requester_department?: string | null;
  institution?: string | null;
  documents?: ApiDocumentRow[] | null;
};

type ApiResponse = {
  count?: number;
  results?: ApiDocumentGroup[];
};

function mapDocument(item: ApiDocumentRow): SampleTestingDocument {
  return {
    id: String(item.id ?? ""),
    documentType: (item.document_type ?? "testing_agreement") as SampleTestingDocumentType,
    documentLabel: String(item.document_label ?? "-"),
    originalName: String(item.original_name ?? "-"),
    mimeType: String(item.mime_type ?? ""),
    size: Number(item.size ?? 0),
    url: String(item.url ?? ""),
    uploadedById: String(item.uploaded_by ?? ""),
    uploadedByName: String(item.uploaded_by_name ?? "-"),
    createdAt: String(item.created_at ?? "-"),
    updatedAt: String(item.updated_at ?? "-"),
  };
}

export function mapAdminSampleTestingDocumentGroup(
  item: ApiDocumentGroup,
): AdminSampleTestingDocumentGroup {
  return {
    sampleTestingId: item.pengujian_id ?? "",
    code: String(item.pengujian_code ?? "-"),
    requesterId: String(item.requester_id ?? ""),
    requesterName: String(item.requester_name ?? "-"),
    requesterDepartment: String(item.requester_department ?? "-"),
    institution: String(item.institution ?? "-"),
    status: String(item.pengujian_status ?? "-"),
    documents: Array.isArray(item.documents) ? item.documents.map(mapDocument) : [],
  };
}

export const sampleTestingDocumentsService = {
  async getList({
    page,
    pageSize,
    documentTypes,
    search,
    status,
    requestedBy,
    department,
    createdAfter,
    createdBefore,
    ordering,
    signal,
  }: {
    page: number;
    pageSize: number;
    documentTypes: SampleTestingDocumentType[];
    search?: string;
    status?: string;
    requestedBy?: string;
    department?: string;
    createdAfter?: string;
    createdBefore?: string;
    ordering?: string;
    signal?: AbortSignal;
  }) {
    const url = new URL(API_PENGUJIAN_DOCUMENTS, window.location.origin);
    url.searchParams.set("page", String(page));
    url.searchParams.set("page_size", String(pageSize));
    url.searchParams.set("document_type", documentTypes.join(","));
    if (search) url.searchParams.set("q", search);
    if (status) url.searchParams.set("status", status);
    if (requestedBy) url.searchParams.set("requested_by", requestedBy);
    if (department) url.searchParams.set("department", department);
    if (createdAfter) url.searchParams.set("created_after", createdAfter);
    if (createdBefore) url.searchParams.set("created_before", createdBefore);
    if (ordering) url.searchParams.set("ordering", ordering);

    const response = await authFetch(url.toString(), {
      method: "GET",
      signal,
    });
    if (!response.ok) {
      throw new Error(`Gagal memuat dokumen pengujian sampel (${response.status})`);
    }

    const payload = (await response.json()) as ApiResponse | ApiDocumentGroup[];
    const list = Array.isArray(payload)
      ? payload
      : Array.isArray(payload.results)
        ? payload.results
        : [];

    return {
      groups: list.map(mapAdminSampleTestingDocumentGroup),
      totalCount: Array.isArray(payload) ? list.length : Number(payload.count ?? list.length),
    };
  },
};
