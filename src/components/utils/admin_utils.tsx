export const MODEL_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL + 'api/v1';



export interface Student {
    userid: string;
    first_name: string;
    last_name: string;
    grade: string;
    age: number;
    parent_guardian: string;
    email: string;
    phone: string;
    country: string;
    user_context: string;
  }

export interface Prompt {
    id: string;
    name: string;
    desc: string
    content: string;
    created_at: string;
}