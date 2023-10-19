window.addEventListener("load", onLoad, false);
function onLoad() {
    const pixelWidthForm = document.getElementById("pixel-width-form");
    pixelWidthForm.addEventListener("submit", generateTable, false);

    document.getElementById("image-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const imageInput = document.getElementById("image-input");

        const file = imageInput.files[0];
        if (!file.type.match(/image.*/)) {
            alert("Please select an image file");
            return;
        }
        const reader = new FileReader();
        reader.onload = (() => {
            return function (e) {
                document.getElementById("image-value").setAttribute("src", e.target.result);
                document.getElementsByClassName("wrapper")[0].style.display = "block";
            };
        })(file);
        reader.readAsDataURL(file);
    });
}

function generateTable(e) {
    e.preventDefault();
    const pixelWidth = document.getElementById("pixel-width");

    const pxSkip = parseInt(pixelWidth.value);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    const image = new Image();
    image.src = document.getElementById("image-value").getAttribute("src");
    image.onload = function () {
        const start = performance.now();
        const table = document.createElement("table", {
            height: image.height,
            width: image.width,
            cellPadding: 0,
            cellSpacing: 0,
        });
        canvas.width = image.width;
        canvas.height = image.height;

        ctx.drawImage(image, 0, 0);

        function componentToHex(c) {
            let hex = c.toString(16);
            return String(hex.length === 1 ? "0" + hex : hex);
        }

        function rgbToHex(r, g, b, a) {
            return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b) + componentToHex(a);
        }

        const style = document.createElement("style");
        style.appendChild(document.createTextNode(`td { height: ${pxSkip}px; }`));

        ctx.drawImage(image, 0, 0);

        const result = document.getElementById("result");
        result.innerHTML = "";
        result.appendChild(table);
        result.appendChild(style);

        for (let j = 0; j < canvas.height; j += pxSkip) {
            const row = document.createElement("tr");
            let prevColor = null;
            let count = 0;
            for (let i = 0; i < canvas.width; i += pxSkip) {
                const imageData = ctx.getImageData(i, j, pxSkip, pxSkip).data;

                // const r = imageData[0];
                // const g = imageData[1];
                // const b = imageData[2];
                // const a = imageData[3];

                const reds = imageData.filter((_, i) => i % 4 === 0);
                const greens = imageData.filter((_, i) => i % 4 === 1);
                const blues = imageData.filter((_, i) => i % 4 === 2);
                const alphas = imageData.filter((_, i) => i % 4 === 3);
                const r = Math.round(reds.reduce((a, b) => a + b, 0) / reds.length);
                const g = Math.round(greens.reduce((a, b) => a + b, 0) / greens.length);
                const b = Math.round(blues.reduce((a, b) => a + b, 0) / blues.length);
                const a = Math.round(alphas.reduce((a, b) => a + b, 0) / alphas.length);
                const color = rgbToHex(r, g, b, a);
                if (prevColor === color) {
                    count++;
                    if (i + pxSkip >= canvas.width) {
                        const col = document.createElement("td");
                        col.style.background = prevColor;
                        col.style.width = `${count * pxSkip}px`;
                        col.colSpan = count;
                        row.appendChild(col);
                    }
                } else {
                    if (prevColor) {
                        const col = document.createElement("td");
                        col.style.background = prevColor;
                        col.style.width = `${count * pxSkip}px`;
                        col.colSpan = count;
                        row.appendChild(col);
                    }
                    prevColor = color;
                    count = 1;
                }
            }
            table.appendChild(row);
        }

        const end = performance.now();
        result.appendChild(document.createTextNode("Took " + (~~(((end - start) / 1000) * 100) / 100 + " seconds")));
    };
}
