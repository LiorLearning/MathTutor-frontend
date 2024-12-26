import { File } from "@/components/bolt/lib/stores/files";

export function convertFilesToXML(
    files: Record<string, File>, 
    artifactId: string,
    artifactTitle: string
): string {
    let xmlOutput = '';

    for (const [filePath, file] of Object.entries(files)) {
        if (file.type === 'file') {
            xmlOutput += `<boltAction type="file" filePath="${filePath}">\n${file.content}\n</boltAction>\n`;
        }
    }

    return `<boltArtifact id="${artifactId}" title="${artifactTitle}">\n${xmlOutput}</boltArtifact>`;
}
