const { clear, info } = require('console');
const fs = require('fs');
const path = require('path');

const figlet = require('figlet');
const chalk = require('chalk');

const puppeteer = require('puppeteer');

const isPkg = typeof process.pkg !== 'undefined';
const chromiumExecutablePath = (isPkg
    ? puppeteer.executablePath().replace(
        /^.*?\\node_modules\\puppeteer\\\.local-chromium/,      //<------ That is for windows users, for linux users use:  /^.*?\/node_modules\/puppeteer\/\.local-chromium/ 
        path.join(path.dirname(process.execPath), 'chromium')   //<------ Folder name, use whatever you want
    )
    : puppeteer.executablePath()
);

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

class Task {
    constructor(nombre, region, numSeguimiento) {
        this.nombre = nombre
        this.region = region
        this.numSeguimiento = numSeguimiento

    }
    nombreImagen() {
        return `${this.nombre}${this.region}-${this.numSeguimiento}`
    }
}

//Esta función comprueba si existe una carpeta, y si no existe la crea
const ensureExists = (path, mask, cb) => {

    if (typeof mask == 'function') { // allow the `mask` parameter to be optional
        cb = mask;
        mask = 0777;
    }
    fs.mkdir(path, mask, function (err) {
        if (err) {
            if (err.code == 'EEXIST') {
                cb(null); // ignore the error if the folder already exists
                console.log("La carpeta SCREENSHOTS ya existe.");
                console.log(" ");
            }
            else cb(err); // something else went wrong
        } else {
            cb(null); // successfully created folder
            console.log("Carpeta SCREENSHOTS creada.");
            console.log(" ");
        }
    });
}

//Array de objetos que almacenará las tasks en formato nombre, region, numSeguimiento
const tasks = []
const taskCreator = () => {

    //Leemos el csv (es un string)
    const csv = fs.readFileSync("./info.csv", 'utf-8').trim()

    //Separamos el string por lineas
    const lineas = csv.split("\n")
        .filter(linea => linea.length >= 30)

    // console.log(lineas);

    for (const key in lineas) {

        const elemento = lineas[key].split('","')
        // .filter(entry => entry.trim() != '')
        // console.log(elemento);


        // ' " ', ' ', ' " \r'

        const nombre = (elemento[0].trim().substr(1))
        const region = (elemento[1].trim())
        const numSeguimiento = (elemento[2].trim().slice(0, -1))
        tasks.push(new Task(nombre, region, numSeguimiento))
    }
    //Eliminamos la primera línea, que es la cabecera del CSV
    tasks.shift()
    console.log("Tasks creadas con éxito.");
    sleep(1000)
}

//Necesita que haya tasks creadas
//Entra en la web con el número de seguimiento y hace una captura
const checkTracking = () => {
    (async () => {
        const browser = await puppeteer.launch({
            executablePath: chromiumExecutablePath,
            // executablePath: './modules/chromium/chrome.exe',
            headless: true
        });
        // const browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();

        for (const task of tasks) {
            //Abre página de login
            await page.goto("https://www.ups.com/WebTracking/track?track=yes&trackNums=" + task.numSeguimiento + "&requester=ST/trackdetails");

            await sleep(1000)

            await page.screenshot({
                path: `./SCREENSHOTS/${task.nombreImagen()}.jpg`,
                type: "jpeg",
                fullPage: true
            });

            await sleep(1000);
            console.log(`Imagen ${task.nombreImagen()} guardada.`);
        }
        browser.close();
        console.log(" ");
        console.log("Programa finalizado.");
    })();

}

const encabezado = (title) => {
    //Fuentes en: http://patorjk.com/software/taag/#p=display&f=Graffiti&t=Type%20Something%20
    //Doom, Standard, Delta corps priest 1
    console.log(" ");
    console.log(
        chalk.redBright(
            figlet.textSync(title.toUpperCase(), {
                horizontalLayout: 'default',
                font: "ansi shadow",//rollo robot
                whitespaceBreak: true,
                horizontalLayout: 'fitted', //full, fitted, default
                // width: 60
            })
        ));
    console.log(
        chalk.red.bold(
            "                                                                             ... by Fentos "
        )
    );
    console.log("\n\n");
}

const setTerminalTitle = (title) => {
    process.stdout.write(
        String.fromCharCode(27) + "]0;" + title + "| By Fentos" + String.fromCharCode(7)
    );
}




//! Aquí empieza la ejecución



clear()
setTerminalTitle("UPS Tracker")

encabezado("UPS  Tracker")

taskCreator()

ensureExists("./SCREENSHOTS", 0744, function (err) {

    if (err); // handle folder creation error
    else return;
});

try {
    checkTracking()
} catch (error) {
    console.log(error);
    console.log('Comprueba que el archivo "info.csv" esté bien rellenado y sin celdas vacías.');
}




