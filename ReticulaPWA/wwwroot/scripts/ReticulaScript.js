var elFokinFetch;
async function getReticula(numControl, contra) {
    try {
        let data = {
            NumeroControl: numControl,
            Password: contra
        };

        let response = await fetch("/api/Reticula", {
            method: "POST", 
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        if (response.ok) {
            return response;
        }

       
    } catch (e) {
        console.error("Error en la solicitud:", e);
    }
}
elFokinFetch = await getReticula("201G0266", "ESCOLARES");
// shared.js
export const sharedData = { message: "InformacionReticula" };
