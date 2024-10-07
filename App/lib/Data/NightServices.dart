import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_dotenv/flutter_dotenv.dart';

class NIGHTServices {
	static Map<String, dynamic> dataStatus = {};

	///////////////////////////////////////////////////////////////
	/// méthode pour récupérer les données des contenues téléchargés sur le server
	Future<Map<String, dynamic>> fetchDataStatus() async {
		Map<String, dynamic> results = {};
		final response = await http.get(
			Uri.parse("http://84.4.230.45:4000/api/contentStatus?api_key=${dotenv.get('NIGHTCENTER_KEY')}"),
		);
		if (response.statusCode == 200) {
			final data = json.decode(response.body);
			results = data;
		} else {
			print("error on the status -> ${response.reasonPhrase}");
		}
		return results;
	}

	///////////////////////////////////////////////////////////////
	/// Méthode pour envoyer un contenu dans le queue de téléchargement du serveur
	Future<void> postDataStatus(Map<String, dynamic> newData, String where) async {
		final url = Uri.parse("http://84.4.230.45:4000/api/contentStatus?api_key=${dotenv.get('NIGHTCENTER_KEY')}");
		final headers = {'Content-Type': 'application/json'};
		final body = jsonEncode({'newData': newData, 'where': where});

		final response = await http.post(url, headers: headers, body: body);

		if (response.statusCode == 201) {
			print('Données ajoutées avec succès');
		} else {
			print('Erreur: ${response.statusCode}');
			print('Message: ${response.body}');
		}
  	}
}