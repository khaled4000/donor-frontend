import React from 'react';
import './FilterControls.css';

const FilterControls = ({ filters, onFilterChange, villageOptions, casesCount }) => {
  return (
    <div className="filter-controls">
      <div className="filter-section">
        <div className="filter-row">
          {/* Search */}
          <div className="filter-group search-group">
            <label htmlFor="search">Search Cases</label>
            <div className="search-input-wrapper">
              <i className="fas fa-search search-icon"></i>
              <input
                id="search"
                type="text"
                placeholder="Search by case ID, family name, village..."
                value={filters.search}
                onChange={(e) => onFilterChange({ search: e.target.value })}
                className="search-input"
              />
              {filters.search && (
                <button
                  className="clear-search"
                  onClick={() => onFilterChange({ search: '' })}
                  title="Clear search"
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
          </div>

          {/* Results count */}
          <div className="results-count">
            <span className="count">{casesCount}</span>
            <span className="label">case{casesCount !== 1 ? 's' : ''} found</span>
          </div>
        </div>

        <div className="filter-row">
          {/* Status Filter */}
          <div className="filter-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              value={filters.status}
              onChange={(e) => onFilterChange({ status: e.target.value })}
              className="filter-select"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending Review</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Village Filter */}
          <div className="filter-group">
            <label htmlFor="village">Village</label>
            <select
              id="village"
              value={filters.village}
              onChange={(e) => onFilterChange({ village: e.target.value })}
              className="filter-select"
            >
              <option value="all">All Villages</option>
              {villageOptions.map((village) => (
                <option key={village} value={village}>
                  {village}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="filter-group">
            <label htmlFor="priority">Priority</label>
            <select
              id="priority"
              value={filters.priority}
              onChange={(e) => onFilterChange({ priority: e.target.value })}
              className="filter-select"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>

          {/* Clear Filters */}
          <div className="filter-group">
            <button
              className="clear-filters-btn"
              onClick={() => onFilterChange({
                status: 'all',
                village: 'all',
                priority: 'all',
                search: '',
              })}
              disabled={
                filters.status === 'all' &&
                filters.village === 'all' &&
                filters.priority === 'all' &&
                !filters.search
              }
            >
              <i className="fas fa-undo"></i>
              Clear Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterControls;
