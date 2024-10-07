import express, { Application } from 'express';
import dataRoute from '../routes/dataRoutes';

const app: Application = express();
const port: number = 4000;
app.use(express.json());
app.use('/api', dataRoute);

/////////////////////////////////////////////////////////////////////////////////
// Fonction pour démarrer le serveur API
export function startAPI(): void {
    app.listen(port, '0.0.0.0',() => {
        console.log(`API en cours d'exécution sur le port : ${port}`);
    });
}