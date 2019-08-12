export class BoilerplateInfo {
  name: string = "";
  actions: [string, string?][] = []; // name with it's optional argument type
  stateProperties: [string, string][] = []; // property name with type

  
  public get capitalized() : string {
    return this.name.charAt(0).toUpperCase() + this.camelCased.slice(1);
  }

  public get camelCased() : string {
    return camelCase(this.name);
  }
}

export function actionTemplate(info: BoilerplateInfo): string {
  return `
    import 'package:fish_redux/fish_redux.dart';

    enum ${info.capitalized}Action { ${ info.actions.map(([name, _]) => name).join(", ") } }

    class ${info.capitalized}ActionCreator {
      ${
        info.actions.map(([name, optionalArgumentType]) => {
          if (optionalArgumentType) {
            let argName = camelCase(optionalArgumentType, true);
            return `
            static Action ${name}Action(${optionalArgumentType} ${argName}) {
              return Action(${info.capitalized}Action.${name}, payload: ${argName});
            }
            `;
          } else {
            return `
              static Action ${name}Action() {
                return const Action(${info.capitalized}Action.${name});
              }
            `;
          }
        }).join('\n')
      }
    }
    `;
}

export function stateTemplate(info: BoilerplateInfo): string {
  return `  
    import 'package:fish_redux/fish_redux.dart';
    import 'package:flutter/material.dart' hide Action;

    class ${info.capitalized}State implements Cloneable<${info.capitalized}State> {
      ${
        info.stateProperties.map(([name, type]) => `${type} ${name};`).join('\n')
      }

      ${info.capitalized}State({${info.stateProperties.map(([name, _]) => `this.${name}`).join(',')}});

      @override
      ${info.capitalized}State clone() => ${info.capitalized}State()
          ${
            info.stateProperties.map(([name, _]) => `..${name} = ${name}`).join('\n')
          };

      @override
      String toString() => 
        """
        ${info.capitalized}State{
          ${
            info.stateProperties.map(([name, _]) => `${name}: $${name}`).join(',\n          ')
          }
        }
        """;
    }

    ${info.capitalized}State initState(${info.capitalized}State state) {
      return state;
    }
  `;
}

export function effectTemplate(info: BoilerplateInfo): string {
  return `  
    import 'package:fish_redux/fish_redux.dart';
    import 'package:flutter/material.dart' hide Action;

    import 'action.dart';
    import 'state.dart';

    Effect<${info.capitalized}State> buildEffect() {
      return combineEffects(<Object, Effect<${info.capitalized}State>>{
        ${
          info.actions.map(([name, _]) => `${info.capitalized}Action.${name}: _${name},`).join("\n")
        }
      });
    }

    ${
      info.actions.map(([name, optionalArgumentType]) => `
        void _${name}(Action action, Context<${info.capitalized}State> ctx) {
          ${
            optionalArgumentType ? `
            final ${optionalArgumentType} ${camelCase(optionalArgumentType, true)} = action.payload;
            ` : ""
          }
          // TODO Remove or rewrite code over generated effect
        }
        `).join("\n\n")
    }
    `;
}

export function reducerTemplate(info: BoilerplateInfo): string {
  return `  
    import 'package:fish_redux/fish_redux.dart';

    import 'action.dart';
    import 'state.dart';

    Reducer<${info.capitalized}State> buildReducer() {
      return asReducer(<Object, Reducer<${info.capitalized}State>>{
        ${
          info.actions.map(([name, _]) => `${info.capitalized}Action.${name}: _${name}Reducer,`).join("\n")
        }
      });
    }

    ${
      info.actions.map(([name, optionalArgumentType]) => `
      ${info.capitalized}State _${name}Reducer(${info.capitalized}State state, Action action) {
          ${
            optionalArgumentType ? `
            final ${optionalArgumentType} ${camelCase(optionalArgumentType, true)} = action.payload;
            ` : ""
          }
          // TODO Remove or rewrite code over generated reducer
          return state.clone();
        }
        `).join("\n\n")
    }
    `;
}


export function viewTemplate(info: BoilerplateInfo): string {
  return `
  import 'package:fish_redux/fish_redux.dart';
  import 'package:flutter/material.dart' hide Action;

  import 'action.dart';
  import 'state.dart';

  Widget buildView(${info.capitalized}State state, Dispatch dispatch, ViewService viewService) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('${info.name}'),
      ),
      body: Container(
        // TODO Fill view 
      ),
    );
  }
  `;
}

export function pageTemplate(info: BoilerplateInfo): string {
  return `
  import 'package:fish_redux/fish_redux.dart';

  import 'effect.dart';
  import 'reducer.dart';
  import 'state.dart';
  import 'view.dart';

  class ${info.capitalized}Page extends Page<${info.capitalized}State, ${info.capitalized}State> {
    ${info.capitalized}Page()
        : super(
            initState: initState,
            effect: buildEffect(),
            reducer: buildReducer(),
            view: buildView,
            // dependencies: Dependencies<${info.capitalized}State>(
            //     adapter: ...,
            //     slots: <String, Dependent<${info.capitalized}State>>{
            //       ...
            //     }),
            // middleware: <Middleware<${info.capitalized}State>>[
            //   logMiddleware(tag: '${info.capitalized}Page'),
            // ],
          );
  }
  `;
}

function camelCase(s: string, forceChangeName = false): string {
  var res = s.replace(/([_-\W]\w)/ig, ($1) => {
    return $1.slice(1).toUpperCase();
  }).replace(/(\W)/ig, '');
  res = res.charAt(0).toLowerCase() + res.slice(1);
  if (forceChangeName && res.valueOf() === s.valueOf()) {
    return '_' + res;
  } else {
    return res;
  }
}