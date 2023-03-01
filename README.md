# GAMut Interactively Visualization Generalized Additive Models for Model Understanding

Demo the prototype [here](https://microsoft.github.io/msrgamut)

See the abstract for this project [here](https://www.microsoft.com/en-us/research/project/msrgamut/)

For reference, you can view the following video:
A paper, presented at SIGCHI 2019 in Glasgow, Scotland is available [here](https://www.microsoft.com/en-us/research/publication/gamut-a-design-probe-to-understand-howdata-scientists-understand-machine-learning-models/)

![Alt](images/gamscreenshot.PNG 'Screenshot')

This code is based on react, d3, mobx, and typescript. It creates an interactive viewer of the system.

## To run

```
npm install
npm start
```

## Dataset Attribution:

The GAMut demonstration includes GAM (General Additive Models) built from several publicly available datasets:

-   **[Ames Iowa Housing Dataset](http://jse.amstat.org/v19n3/decock.pdf)**: All datasets may be freely used in teaching without contacting the author or JSE for permission.

-   Datasets from the **R data repository**: http://vincentarelbundock.github.io/Rdatasets/datasets.html

    -   **Boston Housing**: http://vincentarelbundock.github.io/Rdatasets/doc/MASS/Boston.htmlHarrison, D. and Rubinfeld, D.L. (1978) Hedonic prices and the demand for clean air. J. Environ. Economics and Management 5, 81–102.

        Belsley D.A., Kuh, E. and Welsch, R.E. (1980) Regression Diagnostics. Identifying Influential Data and Sources of Collinearity. New York: Wiley.

    -   **PIMA**: Diabetes in Pima Indian Women: (http://vincentarelbundock.github.io/Rdatasets/doc/MASS/Pima.tr.html)Smith, J. W., Everhart, J. E., Dickson, W. C., Knowler, W. C. and Johannes, R. S. (1988) Using the ADAP learning algorithm to forecast the onset of diabetes mellitus. In Proceedings of the Symposium on Computer Applications in Medical Care (Washington, 1988), ed. R. A. Greenes, pp. 261–265. Los Alamitos, CA: IEEE Computer Society Press.
        Ripley, B.D. (1996) Pattern Recognition and Neural Networks. Cambridge: Cambridge University Press.

    -   **Diamonds**: prices of 50000 round cut diamonds: http://vincentarelbundock.github.io/Rdatasets/doc/ggplot2/diamonds.html
        Diamond data obtained from AwesomeGems.com on July 28, 2005.

-   Datasets from **UCI Machine Learning Repository**: https://archive.ics.uci.edu/ml/index.php (Dua, D. and Graff, C. (2019). UCI Machine Learning Repository [http://archive.ics.uci.edu/ml]. Irvine, CA: University of California, School of Information and Computer Science.)

    -   **Income**: https://archive.ics.uci.edu/ml/datasets/Census+Income

    -   **Heart-disease**: https://archive.ics.uci.edu/ml/datasets/Heart+Disease

        1. Hungarian Institute of Cardiology. Budapest: Andras Janosi, M.D.

        2. University Hospital, Zurich, Switzerland: William Steinbrunn, M.D.

        3. University Hospital, Basel, Switzerland: Matthias Pfisterer, M.D.

        4. V.A. Medical Center, Long Beach and Cleveland Clinic Foundation: Robert Detrano, M.D., Ph.D.

    -   **Red Wine Quality**: https://archive.ics.uci.edu/ml/datasets/wine+quality
        Paulo Cortez, University of Minho, Guimarães, Portugal, http://www3.dsi.uminho.pt/pcortez
        A. Cerdeira, F. Almeida, T. Matos and J. Reis, Viticulture Commission of the Vinho Verde Region(CVRVV), Porto, Portugal
        @2009

    -   **Yacht Hydrodynamics**: http://archive.ics.uci.edu/ml/datasets/yacht+hydrodynamics
        Ship Hydromechanics Laboratory, Maritime and Transport Technology Department, Technical University of Delft.

-   **Titanic Dataset**: Paul Hendricks (2015). titanic: Titanic Passenger Survival Data Set. R package version 0.1.0.

## Contributing

This project welcomes contributions and suggestions. Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft
trademarks or logos is subject to and must follow
[Microsoft's Trademark & Brand Guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general).
Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship.
Any use of third-party trademarks or logos are subject to those third-party's policies.
