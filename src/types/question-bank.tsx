export interface QuestionBankContent {
  content_id: string;
  set_id: string;
  standard_id: string;
  standard_desc: string;
  content_kind: string;
  content_title: string;
  content_url: string;
  grade: string;
  created_at: string;
}

export interface Question {
  question_id: string
  content_id: string
  question_text: string
  question_desc: string
}