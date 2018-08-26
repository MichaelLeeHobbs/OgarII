module.exports = (email, password) => fetch('http://localhost:8080/api/login', {
    method: 'POST',
    body: JSON.stringify({email, password}),
    mode: "cors",
}).then(res => res.json())