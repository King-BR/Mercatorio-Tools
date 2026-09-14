import { useMemo, useState, useEffect } from "react";

import { getTools, getToolsCategories } from "../../services/api.js";

import ToolGrid from "./components/ToolGrid/ToolGrid.jsx";
import TopNavbar from "../../components/TopNavbar/TopNavbar.jsx";

import "./Home.css";

function Home() {
  const [tools, setTools] = useState([]);

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    getTools().then(setTools);
    getToolsCategories().then(setCategories);
  }, []);

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [search, setSearch] = useState("");

  const filteredTools = useMemo(() => {
    console.log(selectedCategory);
    const searchTerm = search.trim().toLowerCase();

    return tools.filter((tool) => {
      const matchesCategory =
        selectedCategory === "all" || tool.category.slug === selectedCategory;

      const matchesSearch = [
        tool.name,
        tool.description,
        tool.category.name,
        ...(tool.tags || []),
      ]
        .join(" ")
        .toLowerCase()
        .includes(searchTerm);

      return matchesCategory && (!searchTerm || (searchTerm && matchesSearch));
    });
  }, [selectedCategory, search, tools, categories]);

  const featuredTools = tools.filter((tool) => tool.featured);

  return (
    <main className="home-page">
      <TopNavbar />

      <section className="hero">
        <div className="hero-content">
          <h1>
            Tools for
            <br />
            <span>Mercatorio</span>
          </h1>

          <p>
            Explore, plan, and analyze the world of Mercatorio through a set of
            tools created by the community to facilitate your journey.
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
                key={category.slug}
                className={`category-button ${
                  selectedCategory === category.slug ? "active" : ""
                }`}
                onClick={() => setSelectedCategory(category.slug)}
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
