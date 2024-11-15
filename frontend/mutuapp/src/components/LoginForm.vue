<script setup>
import router from '@/router'
const userData = {
  username: 'anita',
  password: '123',
}

function login() {
  console.log(userData)

  if (userData.username === 'anita' && userData.password === '123') {
    console.log('login success')
    sessionStorage.setItem('isAuthenticated', true)
    router.push('/')
  } else {
    console.log('login failed')
  }
}
</script>
<template>
  <main class="form-signin">
    <form @submit.prevent="login">
      <img class="mb-4" src="../assets/logo-airan.png" alt="" width="72" height="57" />
      <h1 class="h3 mb-3 fw-normal">Silahkan Login</h1>

      <div class="form-floating">
        <input type="text" class="form-control" id="floatingInput" placeholder="Username" />
        <label for="floatingInput">Username</label>
      </div>
      <div class="form-floating">
        <input type="password" class="form-control" id="floatingPassword" placeholder="Password" />
        <label for="floatingPassword">Password</label>
      </div>

      <!-- <div class="checkbox mb-3">
        <label> <input type="checkbox" value="remember-me" /> Remember me </label>
      </div> -->
      <button class="w-100 btn btn-lg btn-primary" type="submit">Sign in</button>
      <!-- <p class="mt-5 mb-3 text-muted">© 2017–2021</p> -->
    </form>
  </main>
</template>

<style src="../assets/signin.css"></style>
