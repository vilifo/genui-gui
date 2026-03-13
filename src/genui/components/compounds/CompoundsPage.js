import React, {useState, useEffect} from "react";
import { DropdownItem, DropdownMenu, DropdownToggle, UncontrolledDropdown } from 'reactstrap';
import ObjectGroupsList from "../ObjectSelectionList";

function HeaderNav(props) {
  return (<UncontrolledDropdown nav inNavbar>
    <DropdownToggle nav>Add New...</DropdownToggle>
    <DropdownMenu>
      {
        props.molSetChoices.map(choice =>
            (<DropdownItem
                key={choice}
                onClick={() => {props.onMolSetChoice(choice, [])}}
            >
              {props.definitions[choice].name}
            </DropdownItem>)
        )
      }
    </DropdownMenu>
  </UncontrolledDropdown>)
}

function CompoundsPage(props) {
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    props.setPageHeader(
      <HeaderNav
        {...props}
        molSetChoices={Object.keys(props.definitions)}
        onMolSetChoice={(choice, array) => {
          setSelected(choice);
          props.handleAddMolSetList(choice, array);
        }}
      />
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.handleAddMolSetList, props.setPageHeader]);

  const molsets = props.compoundSets;
  if (molsets === null) {
    return <div>Loading...</div>;
  }

  const molsetsEmpty = Object.keys(molsets).length === 0 && molsets.constructor === Object;
  if (molsetsEmpty) {
    return <div><p>There are currently no compound sets. Start by adding one from the actions menu in the top right.</p></div>;
  }

  return (
    <ObjectGroupsList
      {...props}
      id="compound-sets-list"
      objects={molsets}
      objectProp="molset"
      groupNameProp="currentMolsetClass"
      urlProp="molsetListUrl"
      ignoreGroups={["MolSet"]}
      createProp="handleCreateNew"
      deleteProp="handleDelete"
      updateProp="handleUpdate"
      onDelete={props.handleMolSetDelete}
      onCreate={props.handleAddMolSet}
      onUpdate={props.requestMolSetsUpdate}
      focusGroup={selected}
      tasksUrlRoot={props.apiUrls.compoundSetsRoot}
      groupDefinitions={props.definitions}
      // compoundSetsDefinitions={props.definitions}
    />
  );
}
export default CompoundsPage;