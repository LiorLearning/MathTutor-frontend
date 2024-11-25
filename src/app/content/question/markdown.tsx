'use client'

import React, { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import Image from 'next/image'

const MarkdownImage: React.FC<{ src?: string; alt?: string }> = ({ src, alt }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleLoad = () => setIsLoading(false);
  const toggleModal = () => setIsModalOpen(!isModalOpen);

  return (
    <>
      <div className="relative flex justify-start" style={{ 
        width: '100px', 
        height: '100px',
      }}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-lg" style={{ width: '100px', height: '100px' }}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
          </div>
        )}
        <Image
          src={src || ''}
          alt={alt || ''}
          layout="responsive"
          width={100}
          height={100}
          className="rounded-lg cursor-pointer"
          style={{ objectFit: 'contain', width: '100px', height: '100px' }}
          onLoad={handleLoad}
          onClick={toggleModal}
          loading="eager"
        />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75" onClick={toggleModal}>
          <div className="relative w-[90%] h-[90%] max-w-4xl max-h-full p-4 rounded-lg">
            <Image
              src={src || ''}
              alt={alt || ''}
              layout="fill"
              className="rounded-lg"
              style={{ objectFit: 'contain' }}
            />
          </div>
        </div>
      )}
    </>
  );
};

export const MarkdownComponent: React.FC<{ content: string }> = ({ content }) => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.9/MathJax.js?config=TeX-MML-AM_CHTML';
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.MathJax) {
        window.MathJax.Hub.Config({
          tex2jax: {
            inlineMath: [['$', '$'], ['\\$$', '\\$$'], ['\\(', '\\)'], ['\\begin{math}', '\\end{math}']],
            displayMath: [['$$', '$$'], ['\\[', '\\]'], ['\\begin{equation}', '\\end{equation}'], ['\\begin{align}', '\\end{align}']],
            processEscapes: true,
          },
          messageStyle: 'none'
        });
        window.MathJax.Hub.Queue(['Typeset', window.MathJax.Hub]);
      }
    };
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (window.MathJax) {
      window.MathJax.Hub.Queue(['Typeset', window.MathJax.Hub]);
    }
  }, [content]);

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
        h1: (props) => <h1 className="text-3xl font-bold my-4" {...props} />,
        h2: (props) => <h2 className="text-2xl font-semibold my-3" {...props} />,
        h3: (props) => <h3 className="text-xl font-medium my-2" {...props} />,
        h4: (props) => <h4 className="text-lg font-medium my-1.5" {...props} />,
        h5: (props) => <h5 className="text-base font-medium my-1" {...props} />,
        h6: (props) => <h6 className="text-sm font-medium my-1" {...props} />,
        p: (props) => <p className="my-2" {...props} />,
        a: (props) => <a className="text-blue-500 dark:text-blue-300 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
        ul: (props) => <ul className="list-disc pl-6 my-2" {...props} />,
        ol: (props) => <ol className="list-decimal pl-6 my-2" {...props} />,
        li: (props) => <li className="my-0.5" {...props} />,
        blockquote: (props) => <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 py-1 my-2 italic" {...props} />,
        img: (props) => <MarkdownImage src={props.src} alt={props.alt} />,
        pre: (props) => <pre className="my-2" {...props} />,
        table: (props) => <table className="border-collapse table-auto w-full my-2" {...props} />,
        th: (props) => <th className="border border-gray-300 dark:border-gray-600 px-4 py-1 text-left" {...props} />,
        td: (props) => <td className="border border-gray-300 dark:border-gray-600 px-4 py-1" {...props} />,
      }}
      className="prose dark:prose-invert break-words"
    >
      {content}
    </ReactMarkdown>
  );
};
