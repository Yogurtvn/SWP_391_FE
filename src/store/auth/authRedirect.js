function getLandingPathByRole(role) {
  if (role === "admin") {
    return "/admin/dashboard";
  }
  if (role === "staff") {
    return "/staff/dashboard";
  }
  return "/";
}
function getDashboardPathByRole(role) {
  if (role === "admin") {
    return "/admin/dashboard";
  }
  if (role === "staff") {
    return "/staff/dashboard";
  }
  return null;
}
export {
  getDashboardPathByRole,
  getLandingPathByRole
};
