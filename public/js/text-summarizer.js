async function summarizeText() {
    const text = document.getElementById("text").value;
    if (text.trim() === "") {
      alert("Please enter a text!");
      return;
    }
  
    showLoading();
    const summary = await sendApiRequest(text);
    console.log(summary);
    hideLoading();
    if (summary !== null && summary !== "") {
      document.getElementById("summary").innerHTML = summary;
      addToArchive(summary);
    }
  }
  
  async function sendApiRequest(text) {
    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: text }),
      });
  
      if (response.ok) {
        const result = await response.json();
        const summarizedText = result[0].summary_text;
        return summarizedText;
      } else {
        console.log(response.body);
        alert("Something went wrong! Please try again in a little bit.");
      }
    } catch (error) {
      console.log(error);
      alert("Something went wrong! Please try again in a little bit.");
    }
  }
  
  function showLoading() {
    document.getElementById("loader").style.display = "block";
    document.getElementById("btn-bar").style.display = "none";
  }
  
  function hideLoading() {
    document.getElementById("loader").style.display = "none";
    document.getElementById("btn-bar").style.display = "block";
  }
  
  function clearTextField() {
    document.getElementById("text").value = "";
    document.getElementById("summary").innerHTML = "";
    localStorage.removeItem("inputText");
  }
  
  document.getElementById('text').addEventListener('input', () => {
    const currentLength = document.getElementById('text').value.length;
    // Hide the button if the character length exceeds 2500
    if (currentLength > 2500) {
        document.getElementById("btn-sum").style.display = "none";
        document.getElementById("char-error").style.display = "block";
    } else {
      document.getElementById("btn-sum").style.display = "block";
      document.getElementById("char-error").style.display = "none";
    }
  
    if(document.getElementById("text").value === ""){
      document.getElementById("summary").innerHTML = "";
    }
  
    localStorage.setItem('inputText', document.getElementById("text").value);
  });