export abstract class PdfRenderer {
    abstract renderHtml(html: string): Promise<Buffer>;
}
