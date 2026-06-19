# Create React App (no eject) — the standalone way

1. Run the sink server in a second terminal:

       npx devsink

2. Add one line to `public/index.html`, inside <head>:

       <script src="http://localhost:9779/__devsink/client.js"></script>

3. Run CRA as usual (`npm start`). Logs stream to `.devsink/`.
