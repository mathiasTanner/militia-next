export const dynamic = 'force-dynamic';
import { fetchStrapi } from '@/lib/strapi';

export default async function Home() {
  const data = await fetchStrapi('/api/posts?populate=cover&sort=publishedAt:desc');
  const posts = data?.data ?? [];

  return (
    <main className="home">
      <h1>News</h1>
      <ul className="post-list">
        {posts.map((p: any) => {
          console.log(p)
          return (
            <li key={p.id} className="post-item">
              <a href={`/posts/${p.post}`} className="post-title">
                {p.title}
              </a>
              {p.exerpt && <p className="post-excerpt">{p.exerpt}</p>}
            </li>
          );
        })}
      </ul>
    </main>
  );
}