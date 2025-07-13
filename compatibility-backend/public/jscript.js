console.log("HelloWorld");

let profiles = [];

window.addEventListener('DOMContentLoaded', () => {
  fetch('/data/sf_heterosexual_grouped_dataset.csv')
    .then(response => response.text())
    .then(csvText => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
          profiles = results.data.map(row => ({
            ...row,
            Group_ID: String(row.Group_ID ?? "").trim(),
            Male_ID: row.Male_ID != null ? String(parseInt(row.Male_ID)).trim() : "",
            Female_ID: row.Female_ID != null ? String(parseInt(row.Female_ID)).trim() : ""
          }));
          console.log("Loaded profiles:", profiles.length);
          console.log("Sample profiles:", profiles.slice(0, 5));
        }
      });
    })
    .catch(err => console.error("Failed to load CSV:", err));
});

document.getElementById("load-button").addEventListener("click", () => {
  const groupId = String(document.getElementById("group-id").value).trim();
  const maleId = String(document.getElementById("m-id").value).trim();
  const femaleId = String(document.getElementById("f-id").value).trim();

  if (!groupId || !maleId || !femaleId) {
    alert("Please enter Group ID, Male ID, and Female ID.");
    return;
  }

  console.log("Searching for:", { groupId, maleId, femaleId });

  const maleProfile = profiles.find(row =>
    row.Group_ID === groupId && row.Male_ID === maleId
  );

  const femaleProfile = profiles.find(row =>
    row.Group_ID === groupId && row.Female_ID === femaleId
  );

  if (!maleProfile) {
    alert(`No male profile found for Group ${groupId}, Male ID ${maleId}`);
  } else {
    fillProfile(maleProfile, "m");
  }

  if (!femaleProfile) {
    alert(`No female profile found for Group ${groupId}, Female ID ${femaleId}`);
  } else {
    fillProfile(femaleProfile, "f");
  }

  document.getElementById("message").value = "";
  const checkedRadio = document.querySelector('input[name="score"]:checked');
  if (checkedRadio) checkedRadio.checked = false;
});

function fillProfile(person, prefix) {
  const fields = [
    "age", "status", "sex", "orientation", "body_type", "diet", "drinks",
    "drugs", "education", "ethnicity", "height", "income", "job", "last_online",
    "location", "offspring", "pets", "religion", "sign", "smokes", "speaks"
  ];
  const essayFields = Array.from({ length: 10 }, (_, i) => `essay${i}`);

  for (const field of fields) {
    const id = prefix + "-" + simplifyFieldName(field);
    const cell = document.getElementById(id);
    if (cell) cell.textContent = person[field] || "-";
  }

  for (const field of essayFields) {
    const id = prefix + "-" + field;
    const cell = document.getElementById(id);
    if (cell) cell.textContent = person[field] || "-";
  }
}

function simplifyFieldName(field) {
  const map = {
    "smokes": "Smoke",
    "speaks": "language",
    "drinks": "alcohol",
    "sex": "gender",
    "offspring": "kids",
    "ethnicity": "ethinicity",
    "body_type": "bodytype",
    "last_online": "online"
  };
  return map[field] || field;
}

// Compatibility Submission Handler
document.addEventListener("DOMContentLoaded", () => {
  const submitButton = document.querySelector("button[type='submit']");
  if (submitButton) {
    submitButton.addEventListener("click", (e) => {
      e.preventDefault();  // Prevent form reload on submit

      const score = document.querySelector('input[name="score"]:checked')?.value;
      const comment = document.getElementById("message")?.value;
      const surveyorName = document.getElementById("surveyor-name")?.value.trim();
      const groupId = String(document.getElementById("group-id").value).trim();
      const maleId = String(document.getElementById("m-id").value).trim();
      const femaleId = String(document.getElementById("f-id").value).trim();

      if (!surveyorName || !groupId || !maleId || !femaleId || !score) {
        alert("Please fill in all fields and score before submitting.");
        return;
      }

      fetch("/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ surveyorName, groupId, maleId, femaleId, score, comment })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          alert("Submitted successfully!");
        } else {
          alert("Submission failed.");
        }
      })
      .catch(err => {
        console.error("Error:", err);
        alert("An error occurred while submitting. Please try again.");
      });
    });
  }
});
