<template>
  <nav class="navbar">
    <div class="logo">Library System</div>

    <div class="links">
      <RouterLink to="/books">Books</RouterLink>
      <RouterLink to="/add-book">Add Book</RouterLink>
      <RouterLink to="/authors">Authors</RouterLink>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #2c3e50;
  padding: 15px 30px;
}

.logo {
  color: white;
  font-weight: bold;
  font-size: 18px;
}

.links a {
  color: white;
  margin-left: 20px;
  text-decoration: none;
}

.links a.router-link-exact-active {
  font-weight: bold;
  border-bottom: 2px solid white;
}
</style>