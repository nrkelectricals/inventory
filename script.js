const CLIENT_ID =
  "914762279748-isojbtt6n55ob7qcpbd2hjo767j0t773.apps.googleusercontent.com";
const API_KEY = "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"; // Enable APIs & Services for Drive API in Cloud Console
const SCOPES = "https://www.googleapis.com/auth/drive.readonly";
// Specify the columns you want to extract (e.g., "Description" and "Price")
const columnsToExtract = ["SNo", "Description", "Price", "Sale price"];

let tokenClient;
let accessToken;
let inventoryData = [];
let inventoryHeader = [];

// Load the Google API Client Library
function gapiLoad() {
  gapi.load("client", initGapiClient);
}

async function initGapiClient() {
  await gapi.client.init({
    apiKey: API_KEY,
    clientId: CLIENT_ID,
    scope: SCOPES,
  });
  document.getElementById("login-btn").style.display = "block";
}

// Handle Login
function login() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (tokenResponse) => {
      accessToken = tokenResponse.access_token;
      document.cookie = `google_oauth_token=${accessToken}; path=/;`;
      document.getElementById("login-btn").style.display = "none";
      document.getElementById("logout-btn").style.display = "block";
      document.getElementById("content").style.display = "block";
      fetchExcelData();
    },
    redirect_uri: "https://nrkelectricals.github.io/inventory/",
  });
  tokenClient.requestAccessToken();
}

function deleteCookie(name) {
  document.cookie = name + "=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
}

// Handle Logout
function logout() {
  accessToken = null;
  deleteCookie("google_oauth_token");
  document.getElementById("welcome-container").style.display = "block";
  document.getElementById("logout-btn").style.display = "none";
  inventoryTableContainer.style.display = "none";
}

// Load search query from cookie
const getCookies = () =>
  document.cookie.split("; ").reduce((acc, cookie) => {
    const [key, value] = cookie.split("=");
    acc[key] = value;
    return acc;
  }, {});

// Fetch Excel Data
async function fetchExcelData() {
  const fileId = "1mWQh9Rrzz8LHvpDeyp0Nv8Z2VvcXC_6p"; // Upload your Excel file to Google Drive and get the file ID
  const sheetURL = `https://sheets.googleapis.com/v4/spreadsheets/1-byMXoyU2eRJECVHgoCDy_r83XyiRA5jLQNZnRrwCFc/values/Inventory`;

  const response = await fetch(sheetURL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (response.ok) {
    const data = await response.json();
    console.log({ response });
    return { status: response.status, data };
    // document.getElementById("excel-data").textContent = data;
  } else {
    return { status: response.status };
  }
}

document.getElementById("login-btn").onclick = login;
document.getElementById("logout-btn").onclick = logout;

gapiLoad();

const addSearchFunctionality = () => {
  console.log({ inventoryData });
  const query = searchBar.value.toLowerCase();
  const rows = document.getElementById("table-body").querySelectorAll("tr");
  rows.forEach((row) => {
    const cells = Array.from(row.querySelectorAll("td"));
    const matches = cells.some((cell) =>
      cell.textContent.toLowerCase().includes(query)
    );
    row.style.display = matches ? "" : "none";
  });
  //   const filteredInventoryData = inventoryData.filter(item => item.description?.toLowerCase()?.includes(query));
  //   populateTable([inventoryData[0], ...filteredInventoryData]);
};

const populateTableHeader = (headerRow) => {
  const headerElement = document.getElementById("table-header");
  headerRow.forEach((header) => {
    const th = document.createElement("th");
    th.textContent = header;
    headerElement.appendChild(th);
  });
};

const populateTableData = (bodyRows) => {
  // Populate table header
  console.log({ bodyRows });

  // Populate table body

  const bodyElement = document.getElementById("table-body");
  bodyRows.forEach((row) => {
    const tr = document.createElement("tr");
    row.forEach((cell) => {
      const td = document.createElement("td");
      td.textContent = cell;
      tr.appendChild(td);
    });
    bodyElement.appendChild(tr);
  });
};

// Search functionality
const searchBar = document.getElementById("searchBar");
searchBar.addEventListener("input", addSearchFunctionality);

const welcomeContainer = document.getElementById("welcome-container");
const inventoryTableContainer = document.getElementById(
  "inventory-table-container"
);

// Execute on page load
window.addEventListener("load", async () => {
  const cookies = getCookies();
  console.log({ cookies });
  if (cookies.google_oauth_token) {
    accessToken = cookies.google_oauth_token;
    fetchInventory();
  }
});

const loginError = document.getElementById("error-login");

const fetchInventory = async () => {
  const { status, data } = await fetchExcelData();
  console.log({ status, data });
  if (status === 200) {
    welcomeContainer.style.display = "none";
    inventoryTableContainer.style.display = "block";
    document.getElementById("logout-btn").style.display = "block";
    // Assuming the first row contains headers
    const rows = data.values;
    const headers = rows[0];

    const columnIndexes = columnsToExtract.map((col) => headers.indexOf(col));

    // Filter the rows to include only the specified columns
    const filteredData = rows.map((row) =>
      columnIndexes.map((index) => row[index])
    );
    inventoryHeader = headers.filter((item, index) =>
      columnIndexes.includes(index)
    );
    inventoryData = filteredData?.slice(1);

    populateTableHeader(inventoryHeader);
    populateTableData(inventoryData);
  } else if (status === 403) {
    welcomeContainer.style.display = "block";
    loginError.style.display = "block";
    loginError.innerHTML = "Unauthorized user!";
  } else if (status === 401) {
    welcomeContainer.style.display = "block";
  }
};
