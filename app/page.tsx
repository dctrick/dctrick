import { profile, experience, works } from "@/data";
import Contributions from "./Contributions";
import HeroField from "./HeroField";

export default function Home() {
  return (
    <>
    <HeroField />
    <header className="hero">
      <div className="hero-inner">
        <h1>{profile.name}</h1>
        <nav>
          <a href="#about">About</a>
          <a href="#experience">Experience</a>
          <a href="#works">Works</a>
          <a href="#github">GitHub</a>
          <a href="#contact">Contact</a>
        </nav>
      </div>
    </header>
    <main>

      <section id="about" className="first">
        <h2>About me</h2>
        <p>{profile.about}</p>
      </section>

      <section id="experience">
        <h2>Experience</h2>
        <ul className="list">
          {experience.map((e) => (
            <li key={e.role + e.place}>
              <div className="row">
                <strong>{e.role}</strong>
                <span className="muted small">{e.period}</span>
              </div>
              <div className="muted">{e.place}</div>
              <p>{e.detail}</p>
            </li>
          ))}
        </ul>
      </section>

      <section id="works">
        <h2>Works</h2>
        <ul className="list">
          {works.map((w) => (
            <li key={w.title}>
              <a href={w.link} target="_blank" rel="noreferrer" className="work">
                <div className="row">
                  <strong>{w.title}</strong>
                  <span className="muted small">↗</span>
                </div>
                <p>{w.description}</p>
                <div className="tags">
                  {w.tags.map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </div>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section id="github">
        <h2>GitHub</h2>
        <div className="cards">
          <img src="/api/github?card=stats" alt="GitHub stats" width={495} height={195} />
          <img src="/api/github?card=streak" alt="GitHub streak" width={495} height={195} />
        </div>
        <Contributions user={profile.github} />
      </section>

      <section id="contact">
        <h2>Contact</h2>
        <ul className="contact">
          <li>
            <span className="muted">Email</span>
            <a href={`mailto:${profile.email}`}>{profile.email}</a>
          </li>
          <li>
            <span className="muted">Discord</span>
            <span>{profile.discord}</span>
          </li>
          <li>
            <span className="muted">GitHub</span>
            <a href={`https://github.com/${profile.github}`} target="_blank" rel="noreferrer">
              @{profile.github}
            </a>
          </li>
        </ul>
      </section>

      <footer className="muted small">© {new Date().getFullYear()} {profile.name}</footer>
    </main>
    </>
  );
}
