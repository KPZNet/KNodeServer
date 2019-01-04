/*global require,setInterval,console */
const opcua = require("node-opcua");

// Let's create an instance of OPCUAServer
const server = new opcua.OPCUAServer({
    port: 4845, // the port of the listening socket of the server
    resourcePath: "UA/KUANodeServer", // this path will be added to the endpoint resource name
     buildInfo : {
        productName: "KUANodeServer",
        buildNumber: "8000",
        buildDate: new Date(2018,12,19)
    }
});

let totalNodes = 0

function AddProps(KPnt, numVarSets, vUpdaterString, vUpdaterDouble, vUpdaterInt){

    const addressSpace = server.engine.addressSpace;
    const namespace = addressSpace.getOwnNamespace();

    let i = 1
    
    for( i = 1; i<= numVarSets;i++)
    {
        totalNodes += 3;
        namespace.addVariable({
            componentOf: KPnt,
            browseName: "VariableStr"+i,
            dataType: "String",
            value: {
                get: function () {
                    return new opcua.Variant({dataType: opcua.DataType.String, value: vUpdaterString });
                }
            }
        });
        namespace.addVariable({
            componentOf: KPnt,
            browseName: "VariableDbl"+i,
            dataType: "Double",
            value: {
                get: function () {
                    return new opcua.Variant({dataType: opcua.DataType.Double, value: vUpdaterDouble });
                }
            }
        });
        namespace.addVariable({
            componentOf: KPnt,
            browseName: "VariableInt"+i,
            dataType: "Int32",
            value: {
                get: function () {
                    return new opcua.Variant({dataType: opcua.DataType.Int16, value: vUpdaterInt });
                }
            }
        });

    }
}


function AddRootNode(parentNode, baseName, numNodes, maxDepth, numVars, treeDepth)
{
    // add some variables 
    // add a variable named MyVariable1 to the newly created folder "MyDevice"
    let vUpdatedString = "Variable String";
    let vUpdatedDouble = 10.1;
    let vUpdatedInt = 5;
    
    treeDepth++;
    if( treeDepth <= maxDepth  )
    {
        let i = 1
        totalNodes += numNodes;

        for(i = 1; i <= numNodes; i++)
        {
            if(treeDepth == maxDepth)
            {
                // declare a new object
                const addressSpace = server.engine.addressSpace;
                const namespace = addressSpace.getOwnNamespace();
                var KPnt = namespace.addObject({
                    organizedBy: parentNode,
                    browseName: baseName + " " + treeDepth +  " " + i
                });
                iP = AddProps(KPnt, numVars, vUpdatedString, vUpdatedDouble, vUpdatedInt);
            }
            else
            {
                // declare a new object
                const addressSpace = server.engine.addressSpace;
                const namespace = addressSpace.getOwnNamespace();
                var KPnt = namespace.addObject({
                    organizedBy: parentNode,
                    browseName: baseName + " " + treeDepth +  " " + i
                });
                iP = AddProps(KPnt, numVars, vUpdatedString, vUpdatedDouble, vUpdatedInt);
                AddRootNode(KPnt, baseName, numNodes, maxDepth, numVars, treeDepth);
            }
        }

    }  
}


function post_initialize() {
    console.log("*** SERVER Initalizing ... ***");
    function construct_my_address_space(server) {
    
        const addressSpace = server.engine.addressSpace;
        const namespace = addressSpace.getOwnNamespace();

        // declare a new object
        const device = namespace.addObject({
            organizedBy: addressSpace.rootFolder.objects,
            browseName: "Groot"
        });

        const numNodes = 3
        const treeDepth = 4
        const numVars = 1

        

        AddRootNode(device, "JSNode", numNodes, treeDepth, numVars, 0);


        
        // emulate x changing every 500 ms
        //setInterval(function(){  variable1+=1; }, 500);
        
        namespace.addVariable({
            componentOf: device,
            browseName: "Number of Nodes per Branch",
            dataType: "Int32",
            value: {
                get: function () {
                    return new opcua.Variant({dataType: opcua.DataType.Int32, value: numNodes });
                }
            }
        });
        namespace.addVariable({
            componentOf: device,
            browseName: "Number of Depth",
            dataType: "Int32",
            value: {
                get: function () {
                    return new opcua.Variant({dataType: opcua.DataType.Int32, value: treeDepth });
                }
            }
        });        
        namespace.addVariable({
            componentOf: device,
            browseName: "Number of Variables",
            dataType: "Int32",
            value: {
                get: function () {
                    return new opcua.Variant({dataType: opcua.DataType.Int32, value: numVars });
                }
            }
        });
        namespace.addVariable({
            componentOf: device,
            browseName: "Total Nodes",
            dataType: "Int32",
            value: {
                get: function () {
                    return new opcua.Variant({dataType: opcua.DataType.Int32, value: totalNodes });
                }
            }
        });

        
        console.log("*** INITIALIZED Complete Total Nodes : ", totalNodes);

        const os = require("os");

    }
    console.log("KUAServer initializing...");
    construct_my_address_space(server);
    server.start(function() {
        console.log("KUAServer is now listening ... ( press CTRL+C to stop)");
        console.log("port ", server.endpoints[0].port);
        const endpointUrl = server.endpoints[0].endpointDescriptions()[0].endpointUrl;
        console.log(" the primary server endpoint url is ", endpointUrl );
    });
}
server.initialize(post_initialize);