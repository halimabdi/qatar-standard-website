import { getArticles, getLatestArticle } from '@/lib/articles';
import HomePage from '@/components/HomePage';

export const revalidate = 60;

export default function Page() {
  const hero    = getLatestArticle();
  const recent  = getArticles({ limit: 9, offset: hero ? 1 : 0 });
  const latest5 = getArticles({ limit: 5, offset: 1 });
  const sidebar = getArticles({ limit: 6, offset: 10 });

  return <HomePage hero={hero} recent={recent} latest5={latest5} sidebar={sidebar} />;
}
