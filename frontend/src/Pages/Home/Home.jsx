import { useMemo, useState } from "react";

import { categories, tools } from "../../data/tools";

import ToolGrid from "../../components/ToolGrid/ToolGrid";

import "./Home.css";

function Home() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [search, setSearch] = useState("");

  const filteredTools = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return tools.filter((tool) => {
      const matchesCategory =
        selectedCategory === "all" || tool.category === selectedCategory;

      if (!matchesCategory) {
        return false;
      }

      if (!searchTerm) {
        return true;
      }

      const searchableText = [
        tool.name,
        tool.description,
        tool.category,
        ...tool.tags,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(searchTerm);
    });
  }, [selectedCategory, search]);

  const featuredTools = tools.filter((tool) => tool.featured);

  return (
    <main className="home">
      <section className="hero">
        <div className="hero-content">
          <span className="hero-label">MERCATORIO TOOLS</span>

          <h1>
            Tools for
            <br />
            <span>Mercatorio</span>
          </h1>

          <p>
            Explore, plan, and analyze the world of Mercatorio through a set of
            tools created to facilitate your journey.
          </p>

          <div className="search-container">
            <span className="search-icon">🔎</span>

            <input
              type="text"
              placeholder="Search for a tool..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            {search && (
              <button
                className="clear-search"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="home-container">
        {!search && (
          <section className="section">
            <div className="section-header">
              <div>
                <span className="section-label">FEATURED</span>

                <h2>Featured Tools</h2>
              </div>
            </div>

            <ToolGrid tools={featuredTools} featured />
          </section>
        )}

        <section className="section">
          <div className="section-header directory-header">
            <div>
              <span className="section-label">DIRECTORY</span>

              <h2>All Tools</h2>
            </div>

            <span className="tool-count">
              {filteredTools.length}{" "}
              {filteredTools.length === 1 ? "tool" : "tools"}
            </span>
          </div>

          <div className="category-container">
            {categories.map((category) => (
              <button
                key={category.id}
                className={`category-button ${
                  selectedCategory === category.id ? "active" : ""
                }`}
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>

          <ToolGrid tools={filteredTools} />
        </section>
      </div>
    </main>
  );
}

export default Home;
