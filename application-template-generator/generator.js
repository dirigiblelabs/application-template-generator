var response = require("http/v4/response");
var registry = require("platform/v4/registry");
var platformWorkspace = require("platform/v4/workspace");
var templateEngines = require("platform/v4/template-engines");
var lifecycle = require("platform/v4/lifecycle");
var user = require("security/v4/user");

let template = JSON.parse(registry.getText("my-template/template.json"));

var workspaceName = "templates";

let generationContext = getContext();
let project = createProject(generationContext);
generateFromTemplate(template, generationContext, project);

function getContext() {
    return {
        projectName: "alabala",
        parameters: {
            models: [
                {
                    name: "Ivan"
                }, {
                    name: "Dragan"
                }
            ]
        }
    };
}

function createProject(context) {
    let workspace = platformWorkspace.getWorkspace(workspaceName);
    let project = workspace.createProject(context.projectName);
    return project;
}

function createFile(project, fileName, content) {
    let file = project.createFile(fileName);
    file.setText(content);
}

function generateFromTemplate(template, context, project) {
    template.sources.forEach(source => {
        let templateContent = registry.getText(source.location);
        let templateEngine = getTemplateEngine(source);
        if (source.collection && context.parameters[source.collection]) {
            let collection = context.parameters[source.collection];
            collection.forEach(collectionParameters => {
                let generatedContent = templateEngine.generate(templateContent, collectionParameters);
                let fileName = generateFileName(source.rename, collectionParameters);
                createFile(project, fileName, generatedContent);
            });
        } else {
            let generatedContent = templateEngine.generate(templateContent, context.parameters);
            let fileName = generateFileName(source.rename, context.parameters);
            createFile(project, fileName, generatedContent);
        }
    });
    lifecycle.publish(user.getName(), workspaceName, project.getName());
}

function generateFileName(fileNameTemplate, parameters) {
    let templateEngine = templateEngines.getMustacheEngine();
    return templateEngine.generate(fileNameTemplate, parameters);
}

function getTemplateEngine(source) {
    let templateEngine = templateEngines.getVelocityEngine();
    if (source.engine === "mustache") {
        templateEngine = templateEngines.getMustacheEngine();
    }
    return templateEngine;
}

response.println("");
response.println("---------------------------------");
response.println("");
response.println(JSON.stringify(template, null, 2));
response.flush();
response.close();