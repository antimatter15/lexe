export default function (babel) {
  const { types: t } = babel;
  
  return {
    name: "ast-transform", // not required
    visitor: {
      ReferencedIdentifier(path){
        if(path.node.name === "State"){
          let fp = path;
          while(fp && !fp.isFunctionDeclaration()){fp = fp.getFunctionParent()}
          if(fp){
            if(!fp.node._shouldInjectState){
                for(let rp of fp.scope.getBinding(fp.node.id.name).referencePaths){
            if(!rp.parentPath._injectedState && rp.parentPath.isCallExpression()){
              //console.log(rp.parentPath.get('arguments'))
              //console.log(rp.parentPath.node)
              
              rp.parentPath.replaceWith(t.callExpression(rp.parentPath.node.callee, [
                t.identifier('State')
              ].concat(rp.parentPath.node.arguments)))
              // rp.parentPath.pushContainer('arguments', t.identifier('State'))
              // console.log(rp.parentPath.node)
              rp.parentPath._injectedState = true;
            }
         }
              
                let newNode = fp.node;
              fp.node.params = [t.identifier('State'), ...fp.node.params]
              //t.functionDeclaration(fp.node.id, [t.identifier('State'), ...fp.node.params], fp.node.body);
        newNode._shouldInjectState = true;
                
                fp.replaceWith(newNode)
                //console.log(fp.node)
              // fp.unshiftContainer('body', t.expressionStatement(t.identifier('State')))
                //fp.get('params').unshiftContainer('params', t.identifier('State'))
            }
          }
        }
      }
    }
  };
}


