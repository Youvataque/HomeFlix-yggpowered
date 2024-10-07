import fs from 'fs';
import path from 'path';
import axios from 'axios';

const DIRECTORY_TO_WATCH = '/home/youvataque/data_disk/cloud_data';
const JSON_FILE_PATH = path.join(__dirname, '../../onTheServer.json');

/////////////////////////////////////////////////////////////////////////////////
// interface  pour faciliter la lisibilité
interface MediaItem {
    title: string;
	originalTitle: string;
    name: string;
    media: boolean;
	percent:number;
}

interface DataStructure {
    tv: Record<string, MediaItem>;
    movie: Record<string, MediaItem>;
    queue: Record<string, MediaItem>;
	spec: any;
}

const qbittorrentAPI = axios.create({
  baseURL: 'http://localhost:8080/api/v2',
  timeout: 3700,
});

/////////////////////////////////////////////////////////////////////////////////
// fonction pour retirer les accents des titres avant comparaison
function removeAccents(str: string): string {
	return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/////////////////////////////////////////////////////////////////////////////////
// fonction pour récupérer toutes les infos d'un torrent
async function getTorrentProgress(torrentName: string, originalName: string): Promise<number | undefined> {
	try {
		await qbittorrentAPI.post('/auth/login');
		const response = await qbittorrentAPI.get('/torrents/info');
		const searchTerms = removeAccents(torrentName.toLowerCase().replace('&', "et")).split(/[\s._\-:(),]+/).filter(Boolean);
		const originalSearchTerms = removeAccents(originalName.toLowerCase().replace("&", "and")).split(/[\s._\-:(),]+/).filter(Boolean);

		const torrent = response.data.find((t: any) => 
			searchTerms.every(term => removeAccents(t.name.toLowerCase()).split(/[\s._\-:(),]+/).includes(term)) ||
			originalSearchTerms.every(term => removeAccents(t.name.toLowerCase()).split(/[\s._\-:(),]+/).includes(term))
		);
		console.log("args de recherche : " + searchTerms);
		console.log("args de recherche original : " + originalSearchTerms);
		console.log("Liste des torrents : ", response.data.map((t: any) => removeAccents(t.name.toLowerCase()).split(/[\s._\-:(),]+/)));
		if (torrent) {
			console.log("Torrent trouvé : ", torrent.name);
			return parseFloat((torrent.progress * 100).toFixed(2));
		} else {
			console.log(`Torrent "${torrentName}" ou "${originalName}" non trouvé.`);
		}
	} catch (error) {
		console.error('Erreur lors de la récupération de l\'état du torrent:', error);
	}
	return undefined; 
}

/////////////////////////////////////////////////////////////////////////////////
// fonction pour vérifer l'état des films dans la queu, l'enregistrer et déplacer si besoin les contenu  terminés
async function checkAndProcessQueue() {
	try {
		const data = await fs.promises.readFile(JSON_FILE_PATH, 'utf8');
		const jsonData: DataStructure = JSON.parse(data);
		if (Object.keys(jsonData.queue).length === 0) return;

		for (const key in jsonData.queue) {
			const item = jsonData.queue[key];
			const percent = await getTorrentProgress(item.title, item.originalTitle);
			if (percent !== undefined) {
				item.percent = percent;
				jsonData.queue[key].percent = percent;
			}

			if (percent === 100) { 
				if (item.media) {
					jsonData.movie[key] = item;
				} else {
					jsonData.tv[key] = item;
				}
				delete jsonData.queue[key];
			} else {
				console.log(`Encore du boulot : ${percent}`);
			}
		}

		try {
			await fs.promises.writeFile(JSON_FILE_PATH, JSON.stringify(jsonData, null, 2), 'utf8');
			console.log('Fichier JSON mis à jour avec succès');
		} catch (err) {
			console.error('Erreur lors de l\'écriture du fichier JSON:', err);
		}
	} catch (err) {
		console.error('Erreur lors de la lecture du fichier JSON:', err);
	}
}

/////////////////////////////////////////////////////////////////////////////////
// lancement du listener
export function startJsonWatcher(): void {
    setInterval(checkAndProcessQueue, 4000);
    console.log(`Surveillance du dossier : ${DIRECTORY_TO_WATCH}`);
}