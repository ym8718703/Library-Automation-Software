// Utility helper functions for controllers

function getPaginationParams(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

function formatPaginatedResponse(data, totalCount, page, limit) {
  const totalPages = Math.ceil(totalCount / limit) || 1;
  return {
    success: true,
    data,
    pagination: {
      total: totalCount,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  };
}

module.exports = {
  getPaginationParams,
  formatPaginatedResponse
};
