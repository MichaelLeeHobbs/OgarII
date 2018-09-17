const api = process.env.POSTGRES_USER || ''

module.exports = (email, password) => fetch(`${api}/api/login`, {
    method: 'POST',
    body: JSON.stringify({email, password}),
    mode: "cors",
    headers: {
        "Content-Type": "application/json; charset=utf-8",
        // "Content-Type": "application/x-www-form-urlencoded",
    },
}).then(res => res.json())