export interface GeneratedDocuments {
    generationId: string;
    expiresAt: string;
    documents: {
        filename: string;
    }[];
}
