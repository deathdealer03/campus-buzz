/**
 * CategoryFilter Component
 * Horizontal filter buttons for categories
 */

function CategoryFilter({ categories, activeCategory, onCategoryChange }) {
    return (
        <div className="category-filter">
            {/* All Categories Button */}
            <button
                className={`category-btn ${!activeCategory ? 'active' : ''}`}
                onClick={() => onCategoryChange(null)}
            >
                <span className="category-icon">📰</span>
                All News
            </button>

            {/* Category Buttons */}
            {categories.map((category) => (
                <button
                    key={category.id}
                    className={`category-btn ${activeCategory === category.slug ? 'active' : ''}`}
                    onClick={() => onCategoryChange(category.slug)}
                    style={activeCategory === category.slug ? {} : {
                        '--hover-color': category.color
                    }}
                >
                    <span className="category-icon">{category.icon}</span>
                    {category.name}
                    <span className="category-count">{category.news_count || 0}</span>
                </button>
            ))}
        </div>
    );
}

export default CategoryFilter;
