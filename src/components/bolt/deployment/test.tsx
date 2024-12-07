import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VercelDeployer } from './vercel';
import { Octokit } from '@octokit/rest';

vi.mock('@octokit/rest');

describe('VercelDeployer GitHub Operations', () => {
  let vercelDeployer: VercelDeployer;
  
  beforeEach(() => {
    vi.clearAllMocks();
    vercelDeployer = new VercelDeployer('mock-github-token');
  });

  it('should create GitHub repository with files', async () => {
    const mockFiles = {
      'index.js': 'console.log("Hello")',
      'package.json': '{"name": "test"}'
    };

    (Octokit as any).mockImplementation(() => ({
      repos: {
        createForAuthenticatedUser: vi.fn().mockResolvedValue({
          data: {
            clone_url: 'https://github.com/sahasrarjn/testrepo.git',
            owner: { login: 'sahasrarjn' },
            name: 'testrepo'
          }
        })
      },
      git: {
        createTree: vi.fn().mockResolvedValue({
          data: { sha: 'mock-tree-sha' }
        }),
        createCommit: vi.fn().mockResolvedValue({
          data: { sha: 'mock-commit-sha' }
        }),
        createRef: vi.fn().mockResolvedValue({
          data: { ref: 'refs/heads/main' }
        })
      }
    }));

    const result = await (vercelDeployer as any).createGitHubRepository(mockFiles);

    expect(result).toEqual({
      repoUrl: 'https://github.com/sahasrarjn/testrepo.git',
      owner: 'sahasrarjn',
      repoName: 'testrepo'
    });
  });

  it('should handle GitHub repository creation failure', async () => {
    (Octokit as any).mockImplementation(() => ({
      repos: {
        createForAuthenticatedUser: vi.fn().mockRejectedValue(
          new Error('Repository creation failed')
        )
      }
    }));

    const mockFiles = {
      'index.js': 'console.log("Hello")'
    };

    await expect((vercelDeployer as any).createGitHubRepository(mockFiles))
      .rejects
      .toThrow('Failed to create GitHub repository. Please check your GitHub token has sufficient permissions.');
  });

  it('should create repository with correct file structure', async () => {
    const mockCreateForAuthenticatedUser = vi.fn().mockResolvedValue({
      data: {
        clone_url: 'https://github.com/sahasrarjn/testrepo.git',
        owner: { login: 'sahasrarjn' },
        name: 'testrepo'
      }
    });

    const mockCreateTree = vi.fn().mockResolvedValue({
      data: { sha: 'mock-tree-sha' }
    });

    (Octokit as any).mockImplementation(() => ({
      repos: {
        createForAuthenticatedUser: mockCreateForAuthenticatedUser
      },
      git: {
        createTree: mockCreateTree,
        createCommit: vi.fn().mockResolvedValue({
          data: { sha: 'mock-commit-sha' }
        }),
        createRef: vi.fn().mockResolvedValue({})
      }
    }));

    const mockFiles = {
      'src/index.js': 'console.log("Hello")',
      'package.json': '{"name": "test"}'
    };

    await (vercelDeployer as any).createGitHubRepository(mockFiles);

    expect(mockCreateTree).toHaveBeenCalledWith({
      owner: 'sahasrarjn',
      repo: 'testrepo',
      tree: expect.arrayContaining([
        {
          path: 'src/index.js',
          mode: '100644',
          type: 'blob',
          content: 'console.log("Hello")'
        },
        {
          path: 'package.json', 
          mode: '100644',
          type: 'blob',
          content: '{"name": "test"}'
        }
      ])
    });
  });
});
