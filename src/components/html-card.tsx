import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileIcon, Maximize2Icon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import DOMPurify from 'dompurify'; // For sanitizing HTML

interface HtmlCardProps {
  htmlContent: string;
  name: string;
}

const HtmlCard: React.FC<HtmlCardProps> = ({ htmlContent, name }) => (
  <div
    className="html-card"
    style={{ aspectRatio: '16/9' }} // Fixing the aspect ratio
    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(htmlContent) }}
  />
);

interface HtmlListProps {
  artifacts: { url: string; name: string; desc: string }[];
}

const HtmlList: React.FC<HtmlListProps> = ({ artifacts }) => {
  const [htmlContents, setHtmlContents] = useState<string[]>([]);

  useEffect(() => {
    const fetchHtmlContent = async () => {
      const contents = await Promise.all(
        artifacts.map(async (artifact) => {
          const response = await fetch(artifact.url);
          const text = await response.text();
          return text;
        })
      );
      setHtmlContents(contents);
    };

    fetchHtmlContent();
  }, [artifacts]);

  if (htmlContents.length === 0) {
    return <p>Loading...</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
      {artifacts.map((artifact, index) => (
        <Card key={artifact.url} className="overflow-hidden max-w-xs">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileIcon className="mr-2" />
              {artifact.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" className="w-full p-0 h-auto hover:opacity-80 transition-opacity">
                  <HtmlCard htmlContent={htmlContents[index]} name={artifact.name} />
                  <span className="sr-only">View larger image of {artifact.name}</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{artifact.name}</DialogTitle>
                </DialogHeader>
                <HtmlCard htmlContent={artifact.desc} name={artifact.name} />
              </DialogContent>
            </Dialog>
          </CardContent>
          <CardFooter className="flex justify-between items-center">
            <Button asChild variant="ghost" size="sm">
              <a href={artifact.url} target="_blank" rel="noopener noreferrer" className="flex items-center">
                View HTML
                <Maximize2Icon className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default HtmlList;
