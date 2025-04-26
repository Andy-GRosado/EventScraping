import { current_connection, getConnection, setCurrentConnection } from "./src/controllers/db.controller";
import { ConsultaRucHandler } from "./src/handler/business.handler"
import { main } from "./src/main";

async function scraping() {
  setCurrentConnection('127.0.0.1', '27000', 'business_data', { db_authentication: 'admin', db_username: 'admin', db_password: 'admin' });
  current_connection.once('connected', async () => {
    let requester_cr = new ConsultaRucHandler(current_connection);
    let data1 = await requester_cr.bulkRequestAndUpdate(['10474175699', '20609366185', '20609919893', '10736963316', '20291772286'])
    console.log(data1);

    // Example of using the connection for further operations
    // let requester_cr = new ConsultaRucHandler(actual_connection);
    // let data1 = await requester_cr.bulkRequestAndUpdate(['10474175699', '20609366185', '20609919893', '10736963316', '20291772286']);
    // console.log(data1);

    // Close the connection after operations
    await current_connection.close();
  });

  // await actual_connection.close();
}

await main()


