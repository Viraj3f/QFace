
// The code that runs after emscripten/db is fully loaded.
let main = function() {
    Module.addCustomer_init();
    let photosTaken = false;

    let displayMostRecentlyDetectedImage = function () {
        let imageContainer = document.getElementById("images");
        imageContainer.style.display = "flex";
        let newImage = document.createElement("img");
        newImage.src = "data:image/png;base64," + Module.addCustomer_mostRecentDetectedFace();
        newImage.classList.add("croppedImage");
        newImage.classList.add("fadeIn");
        imageContainer.appendChild(newImage);
    }

    // Returns the webcam frame as a b64 string.
    let getFrame = function () {
        let canvas = document.createElement('canvas');
        let ctx = canvas.getContext('2d');

        //draw image to canvas. scale to target dimensions
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        //convert to desired file format
        let dataURI = canvas.toDataURL('image/png').replace('data:image/png;base64,','');

        return dataURI;
    }

    // Ran when the Take Picture button is clicked.
    document.getElementById("tpButton").onclick = function(){
        let dataURI = getFrame();

        // Crop the face and save it to temporary storage.
        let success = Module.addCustomer_saveFaceInTemporaryStorage(dataURI);
        if (!success) {
            return;
        }
        photosTaken = true;
        displayMostRecentlyDetectedImage();
    };

    // Automatically detect faces
    document.getElementById("detectFace").onclick = function(){
        let imagesTaken = 0;
        let imagesToTake = 8;
        let delay = 100;

        let singlePictureButton = document.getElementById("tpButton");
        let saveButton = document.getElementById("save-button");
        let clearButton = document.getElementById("clear-button");

        let imageCounter = document.getElementById("imageCounter")
        let errorDisplay = document.getElementById("errorMessages")

        this.disabled = true;
        singlePictureButton.disabled = true;
        saveButton.disabled = true;
        clearButton.disabled = true;
        imageCounter.style.display = 'block';

        // Display console log messages to user.
        let oldLogger = window.console.log;
        window.console.log = function(message) {
            errorDisplay.innerText = message;
        }

        let takePictureFromVideo = () => {
            if (imagesTaken >= imagesToTake) {
                window.console.log = oldLogger;
                this.disabled = false;
                singlePictureButton.disabled = false;
                saveButton.disabled = false;
                clearButton.disabled = false;
                imageCounter.style.display = 'none';
                return;
            }

            let dataURI = getFrame();

            // Crop the face and save it to temporary storage.
            let success = Module.addCustomer_saveFaceInTemporaryStorage(dataURI);

            if (success) {
                errorDisplay.innerText = "";
                // Only record and display a picture when it was successfully
                // detected.
                photosTaken = true;
                displayMostRecentlyDetectedImage();

                imagesTaken += 1;
                imageCounter.innerText = "Images taken: " + imagesTaken + "/" + imagesToTake;
            }

            setTimeout(takePictureFromVideo, 400);
        }

        takePictureFromVideo();
    };

    // Ran when the "save" button is clicked.
    document.getElementById("save-button").onclick = function() {
        if (!photosTaken) {
            alert("No pictures taken - press the \"Take Picture\" button.")
            return;
        }

        let studentId = window.parseInt(document.getElementById("studentId-form").value);
        if (!studentId) {
            alert("Invalid studentId");
            return;
        }
        Module.addCustomer_clean();
        Module.persist().then(() => {
            let nextURL =
                window
                .location
                .href
                .replace("addCustomer", "saveCustomer") + "?studentId=" + studentId;
            window.location.href = nextURL;
        });
    }

    document.getElementById("clear-button").onclick = function() {
        Module.clearTemporaryStorage();
        let imageContainer = document.getElementById("images");
        while (imageContainer.hasChildNodes()) {
            imageContainer.removeChild(imageContainer.lastChild);
        }
        imageContainer.style.display = 'none';
    }
}
