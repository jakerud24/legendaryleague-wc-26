export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const API_KEY = process.env.REACT_APP_API_FOOTBALL_KEY;
  const { endpoint } = req.query;

  if (!endpoint) {
    return res.status(400).json({ error: 'Missing endpoint param' });
  }

  try {
    const url = `https://v3.football.api-sports.io/${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'x-apisports-key': API_KEY,
      },
    });
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
