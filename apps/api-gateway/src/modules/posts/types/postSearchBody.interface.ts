export interface PostSearchBody {
  id: string;
  text: string;
  authorId: string;
}

export interface PostSearchResult {
  hits: {
    total: number;
    hits: Array<{
      _source: PostSearchBody;
    }>;
  };
}
