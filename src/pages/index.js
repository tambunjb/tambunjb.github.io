import React, { useState } from 'react';
import * as cheerio from "cheerio";

// Fetch data at build time
export async function getStaticProps() {
  const user = 'tambunjb';

  // Fetch repositories from GitHub
  const repos = await fetch(`https://api.github.com/users/${user}/repos`).then((res) => res.json());

  // Fetch README data and construct project details
  const projects = await Promise.all(
    repos.map(async (repo) => {
      try {
        const readmeText = await fetch(
          `https://raw.githubusercontent.com/${user}/${repo.name}/main/README.md`
        ).then((res) => res.text());

        // Parse the README content using Cheerio
        const $ = cheerio.load(readmeText);

        // Extract elements by ID
        const title = $("#tjidtitle").text() || repo.name;
        const technologies = $("#tjidtechs").text().split(",").map((tech) => tech.trim());

        const links = [];
        links.push(repo.html_url); // Add the GitHub link by default
        $("#tjidlinks li").each((_, link) => {
          links.push($(link).text().trim());
        });

        return {
          name: repo.name,
          html_url: repo.html_url,
          title,
          technologies,
          description: repo.description,
          links,
        };
      } catch (error) {
        console.error(`Failed to fetch README for ${repo.name}:`, error);
        return {
          name: repo.name,
          html_url: repo.html_url,
          title: repo.name,
          technologies: [],
          description: repo.description,
          links: `<a href="${repo.html_url}" target="_blank">${repo.html_url}</a>`,
        };
      }
    })
  );

  return { props: { projects } };
}

// Main Component
const Home = ({ projects }) => {
  const [filteredTech, setFilteredTech] = useState([]);
  const techSet = [...new Set(projects.flatMap((project) => project.technologies))]
  .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

  // Handle filter button clicks
  const toggleTechFilter = (tech) => {
    setFilteredTech((prev) =>
      prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech]
    );
  };

  // Compute filtered and other projects
  const filteredProjects = projects.filter((project) =>
    filteredTech.some((tech) => project.technologies.includes(tech))
  ).sort((a, b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase()));;

  const otherProjects =
    (filteredTech.length === 0
      ? projects // When no tech is selected, all projects appear here
      : projects.filter((project) => !filteredProjects.includes(project)))
      .sort((a, b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase()));

  // Compute the count of projects per technology
  const techCounts = techSet.reduce((acc, tech) => {
    acc[tech] = projects.filter((project) => project.technologies.includes(tech)).length;
    return acc;
  }, {});

  return (
    <div>
      <h1>Jonathan Tambun&apos;s Portfolio</h1>
      <hr />

      {/* Technology Filter Buttons */}
      <div id="buttons-filter" style={{ marginBottom: '1rem' }}>
        {techSet.map((tech) => (
          <button
            key={tech}
            onClick={() => toggleTechFilter(tech)}
            style={{
              margin: '5px',
              padding: '10px',
              backgroundColor: filteredTech.includes(tech) ? 'gray' : 'white',
              border: '1px solid black',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            {tech} ({techCounts[tech]})
          </button>
        ))}
      </div>

      {/* Filtered Projects */}
      {filteredTech.length > 0 && (
        <div id="filtered-projects">
          <h2>Filtered Projects ({filteredProjects.length})</h2>
          {filteredProjects.length > 0 ? (
            filteredProjects.map((project) => (
              <div key={project.name} style={{ marginBottom: '1.5rem' }}>
                <h3>{project.title}</h3>
                <p>{project.description}</p>
                <p>Technologies: {project.technologies.join(', ')}</p>
                <div className="row">
                  <div>Links: </div>
                  <div>
                    {project.links.map((link, index) => (
                      <span key={index}>
                        -{" "}
                        <a href={link} target="_blank" rel="noopener noreferrer">
                          {link}
                        </a>
                        <br />
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p>No projects match the selected technology.</p>
          )}
        </div>
      )}

      <hr />
      {/* Other Projects */}
      <div id="other-projects">
        <h2>{filteredTech.length > 0 ? 'Other Projects' : 'All Projects'} ({otherProjects.length})</h2>
        {otherProjects.map((project) => (
          <div key={project.name} style={{ marginBottom: '1.5rem' }}>
            <h3>{project.title}</h3>
            <p>{project.description}</p>
            <p>Technologies: {project.technologies.join(', ')}</p>
            <div className="row">
              <div>Links: </div>
              <div>
                {project.links.map((link, index) => (
                  <span key={index}>
                    -{" "}
                    <a href={link} target="_blank" rel="noopener noreferrer">
                      {link}
                    </a>
                    <br />
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;