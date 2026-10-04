/* eslint-disable */
import { getLocale, experimentalStaticLocale } from "../runtime.js"

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */
/** @typedef {{}} Add_ApiInputs */
/** @typedef {{}} Add_AuthInputs */
/** @typedef {{}} Add_BackendInputs */
/** @typedef {{}} Add_DatabaseInputs */
/** @typedef {{}} Add_DeploymentInputs */
/** @typedef {{}} Add_DesktopInputs */
/** @typedef {{}} Add_FrameworkInputs */
/** @typedef {{}} Addon_DefaultInputs */
/** @typedef {{}} Addon_Desc_KnipInputs */
/** @typedef {{}} Addon_Desc_UltraciteInputs */
/** @typedef {{}} AddonsInputs */
/** @typedef {{}} Api_ClientsInputs */
/** @typedef {{}} Cap_Frontend_FrameworkInputs */
/** @typedef {{}} Cap_Fullstack_FrameworkInputs */
/** @typedef {{}} Cap_Hono_ServerInputs */
/** @typedef {{}} Cap_Http_ServerInputs */
/** @typedef {{}} Cap_Node_RuntimeInputs */
/** @typedef {{}} Cap_ReactInputs */
/** @typedef {{}} Cap_RouterInputs */
/** @typedef {{}} Cap_RpcInputs */
/** @typedef {{}} Cap_Single_Page_AppInputs */
/** @typedef {{}} Cap_Sql_DatabaseInputs */
/** @typedef {{}} Cap_Sql_OrmInputs */
/** @typedef {{}} Cap_Ui_ComponentsInputs */
/** @typedef {{}} Change_Demo_ApplyInputs */
/** @typedef {{}} Change_Demo_FailedInputs */
/** @typedef {{}} Change_Demo_LabelInputs */
/** @typedef {{}} Change_Demo_NoteInputs */
/** @typedef {{}} Change_Demo_PassedInputs */
/** @typedef {{}} Change_Demo_PendingInputs */
/** @typedef {{}} Change_Demo_ResetInputs */
/** @typedef {{}} Change_Demo_RunInputs */
/** @typedef {{}} Change_Quality_CheckInputs */
/** @typedef {{}} Change_Quality_DraftInputs */
/** @typedef {{}} Change_Quality_FixInputs */
/** @typedef {{}} Change_Stage_CheckInputs */
/** @typedef {{}} Change_Stage_DraftInputs */
/** @typedef {{}} Change_Stage_FixInputs */
/** @typedef {{}} Change_Tests_CheckInputs */
/** @typedef {{}} Change_Tests_DraftInputs */
/** @typedef {{}} Change_Tests_FixInputs */
/** @typedef {{}} Change_Types_CheckInputs */
/** @typedef {{}} Change_Types_DraftInputs */
/** @typedef {{}} Change_Types_FixInputs */
/** @typedef {{}} CloseInputs */
/** @typedef {{}} Close_FileInputs */
/** @typedef {{}} Copy_CommandInputs */
/** @typedef {{}} Copy_FileInputs */
/** @typedef {{}} Create_Agent_CopiedInputs */
/** @typedef {{}} Create_Agent_CopyInputs */
/** @typedef {{}} Create_Agent_HintInputs */
/** @typedef {{}} Create_Agent_PreviewInputs */
/** @typedef {{ skill: NonNullable<unknown>, command: NonNullable<unknown> }} Create_Agent_PromptInputs */
/** @typedef {{}} Create_ItInputs */
/** @typedef {{}} Create_ModeInputs */
/** @typedef {{}} Create_TerminalInputs */
/** @typedef {{}} CurrentInputs */
/** @typedef {{ name: NonNullable<unknown> }} Deployment_ImageInputs */
/** @typedef {{ name: NonNullable<unknown> }} Deployment_PostgresInputs */
/** @typedef {{}} Desc_Better_AuthInputs */
/** @typedef {{}} Desc_BunInputs */
/** @typedef {{}} Desc_DockerInputs */
/** @typedef {{}} Desc_DrizzleInputs */
/** @typedef {{}} Desc_ElectronInputs */
/** @typedef {{}} Desc_HonoInputs */
/** @typedef {{}} Desc_NextInputs */
/** @typedef {{}} Desc_NodeInputs */
/** @typedef {{}} Desc_OpenapiInputs */
/** @typedef {{}} Desc_OrpcInputs */
/** @typedef {{}} Desc_PostgresInputs */
/** @typedef {{}} Desc_ReactInputs */
/** @typedef {{}} Desc_SelfInputs */
/** @typedef {{}} Desc_ShadcnInputs */
/** @typedef {{}} Desc_SpaInputs */
/** @typedef {{}} Desc_SqliteInputs */
/** @typedef {{}} Desc_Tanstack_RouterInputs */
/** @typedef {{}} Desc_Tanstack_StartInputs */
/** @typedef {{}} Desc_Vite_PlusInputs */
/** @typedef {{}} Desc_Vitest_PlaywrightInputs */
/** @typedef {{}} Desktop_DistInputs */
/** @typedef {{}} Desktop_Dist_PillInputs */
/** @typedef {{}} Desktop_ProxyInputs */
/** @typedef {{}} Desktop_Proxy_PillInputs */
/** @typedef {{}} Docs_AnchorInputs */
/** @typedef {{}} Docs_Back_HomeInputs */
/** @typedef {{}} Docs_Copy_CodeInputs */
/** @typedef {{ page: NonNullable<unknown> }} Docs_Document_TitleInputs */
/** @typedef {{}} Docs_EditInputs */
/** @typedef {{}} Docs_NavInputs */
/** @typedef {{}} Docs_NextInputs */
/** @typedef {{}} Docs_On_This_PageInputs */
/** @typedef {{}} Docs_PaginationInputs */
/** @typedef {{}} Docs_PreviousInputs */
/** @typedef {{}} Document_DescriptionInputs */
/** @typedef {{}} Document_TitleInputs */
/** @typedef {{}} Electron_ProcessInputs */
/** @typedef {{}} Engineering_CapabilitiesInputs */
/** @typedef {{}} Extensions_AboutInputs */
/** @typedef {{}} Extensions_NoneInputs */
/** @typedef {{ count: NonNullable<unknown> }} File_CountInputs */
/** @typedef {{}} Fit_Better_AuthInputs */
/** @typedef {{}} Fit_BunInputs */
/** @typedef {{}} Fit_DockerInputs */
/** @typedef {{}} Fit_ElectronInputs */
/** @typedef {{}} Fit_HonoInputs */
/** @typedef {{}} Fit_NextInputs */
/** @typedef {{}} Fit_NodeInputs */
/** @typedef {{}} Fit_None_ApiInputs */
/** @typedef {{}} Fit_None_AuthInputs */
/** @typedef {{}} Fit_None_BackendInputs */
/** @typedef {{}} Fit_None_DatabaseInputs */
/** @typedef {{}} Fit_None_DeploymentInputs */
/** @typedef {{}} Fit_None_DesktopInputs */
/** @typedef {{}} Fit_None_FrameworkInputs */
/** @typedef {{}} Fit_OpenapiInputs */
/** @typedef {{}} Fit_OrpcInputs */
/** @typedef {{}} Fit_PostgresInputs */
/** @typedef {{}} Fit_SelfInputs */
/** @typedef {{}} Fit_SpaInputs */
/** @typedef {{}} Fit_SqliteInputs */
/** @typedef {{}} Fit_Tanstack_StartInputs */
/** @typedef {{}} Gate_BuildInputs */
/** @typedef {{}} Gate_Build_WebInputs */
/** @typedef {{}} Gate_CheckInputs */
/** @typedef {{}} Gate_Check_HereInputs */
/** @typedef {{}} Gate_CheckingInputs */
/** @typedef {{ count: NonNullable<unknown> }} Gate_E2eInputs */
/** @typedef {{}} Gate_FingerprintInputs */
/** @typedef {{}} Gate_InstallInputs */
/** @typedef {{}} Gate_KnipInputs */
/** @typedef {{}} Gate_MatchInputs */
/** @typedef {{}} Gate_MigrateInputs */
/** @typedef {{}} Gate_MismatchInputs */
/** @typedef {{ when: NonNullable<unknown>, seconds: NonNullable<unknown> }} Gate_PassedInputs */
/** @typedef {{ count: NonNullable<unknown> }} Gate_TestInputs */
/** @typedef {{}} Gate_TypegenInputs */
/** @typedef {{}} Gate_VerifiedInputs */
/** @typedef {{}} GithubInputs */
/** @typedef {{ changes: NonNullable<unknown> }} Home_AdjustedInputs */
/** @typedef {{}} Home_Base_BodyInputs */
/** @typedef {{}} Home_Base_TitleInputs */
/** @typedef {{ stacks: NonNullable<unknown> }} Home_BodyInputs */
/** @typedef {{}} Home_Built_OnInputs */
/** @typedef {{}} Home_Cta_BodyInputs */
/** @typedef {{}} Home_Cta_TitleInputs */
/** @typedef {{}} Home_NoneInputs */
/** @typedef {{}} Home_OpenInputs */
/** @typedef {{}} Home_Open_StackInputs */
/** @typedef {{}} Home_Stack_CountInputs */
/** @typedef {{ layers: NonNullable<unknown>, technologies: NonNullable<unknown> }} Home_Stack_MathInputs */
/** @typedef {{}} Home_TitleInputs */
/** @typedef {{}} Home_Title_RestInputs */
/** @typedef {{}} Home_Verify_BodyInputs */
/** @typedef {{}} Home_Verify_FollowInputs */
/** @typedef {{}} Home_Verify_TitleInputs */
/** @typedef {{}} Hono_ProcessInputs */
/** @typedef {{}} Just_NowInputs */
/** @typedef {{}} Kind_ApiInputs */
/** @typedef {{}} Kind_AuthInputs */
/** @typedef {{}} Kind_BackendInputs */
/** @typedef {{}} Kind_DatabaseInputs */
/** @typedef {{}} Kind_DeploymentInputs */
/** @typedef {{}} Kind_DesktopInputs */
/** @typedef {{}} Kind_FrameworkInputs */
/** @typedef {{}} Kind_FrontendInputs */
/** @typedef {{}} Kind_OrmInputs */
/** @typedef {{}} Kind_RouterInputs */
/** @typedef {{}} Kind_RuntimeInputs */
/** @typedef {{}} Kind_TestingInputs */
/** @typedef {{}} Kind_ToolchainInputs */
/** @typedef {{}} Kind_UiInputs */
/** @typedef {{}} Knip_Scope_DefaultInputs */
/** @typedef {{}} Knip_Scope_DesktopInputs */
/** @typedef {{}} LanguageInputs */
/** @typedef {{ name: NonNullable<unknown> }} Learn_AboutInputs */
/** @typedef {{}} Nav_DocsInputs */
/** @typedef {{}} Nav_StudioInputs */
/** @typedef {{}} None_ApiInputs */
/** @typedef {{}} None_AuthInputs */
/** @typedef {{}} None_BackendInputs */
/** @typedef {{}} None_DatabaseInputs */
/** @typedef {{}} None_DeploymentInputs */
/** @typedef {{}} None_DesktopInputs */
/** @typedef {{}} None_FrameworkInputs */
/** @typedef {{}} None_TokenInputs */
/** @typedef {{}} Not_Found_BodyInputs */
/** @typedef {{}} Not_Found_HomeInputs */
/** @typedef {{}} Not_Found_TitleInputs */
/** @typedef {{}} Not_VerifiedInputs */
/** @typedef {{}} Note_Any_PostgresInputs */
/** @typedef {{}} Note_Auth_SecretInputs */
/** @typedef {{ path: NonNullable<unknown> }} Note_Sqlite_FileInputs */
/** @typedef {{}} OrmInputs */
/** @typedef {{}} Package_ManagerInputs */
/** @typedef {{}} Package_RunnerInputs */
/** @typedef {{}} Pillar_Quality_BodyInputs */
/** @typedef {{}} Pillar_Quality_TitleInputs */
/** @typedef {{}} Pillar_Tests_BodyInputs */
/** @typedef {{}} Pillar_Tests_TitleInputs */
/** @typedef {{}} Pillar_Types_BodyInputs */
/** @typedef {{}} Pillar_Types_TitleInputs */
/** @typedef {{}} Postgres_ProcessInputs */
/** @typedef {{}} PreviewInputs */
/** @typedef {{ label: NonNullable<unknown> }} PreviewingInputs */
/** @typedef {{ name: NonNullable<unknown> }} ProcessInputs */
/** @typedef {{ name: NonNullable<unknown> }} Process_With_ApiInputs */
/** @typedef {{}} Project_NameInputs */
/** @typedef {{ name: NonNullable<unknown>, max: NonNullable<unknown> }} Project_Name_InvalidInputs */
/** @typedef {{}} RecommendedInputs */
/** @typedef {{}} Role_ApiInputs */
/** @typedef {{}} Role_Api_AboutInputs */
/** @typedef {{}} Role_Api_NoneInputs */
/** @typedef {{}} Role_Api_QuestionInputs */
/** @typedef {{}} Role_AuthInputs */
/** @typedef {{}} Role_Auth_AboutInputs */
/** @typedef {{}} Role_Auth_NoneInputs */
/** @typedef {{}} Role_Auth_QuestionInputs */
/** @typedef {{}} Role_BackendInputs */
/** @typedef {{}} Role_Backend_AboutInputs */
/** @typedef {{}} Role_Backend_NoneInputs */
/** @typedef {{}} Role_Backend_QuestionInputs */
/** @typedef {{}} Role_DatabaseInputs */
/** @typedef {{}} Role_Database_AboutInputs */
/** @typedef {{}} Role_Database_NoneInputs */
/** @typedef {{}} Role_Database_QuestionInputs */
/** @typedef {{}} Role_DeploymentInputs */
/** @typedef {{}} Role_Deployment_AboutInputs */
/** @typedef {{}} Role_Deployment_NoneInputs */
/** @typedef {{}} Role_Deployment_QuestionInputs */
/** @typedef {{}} Role_DesktopInputs */
/** @typedef {{}} Role_Desktop_AboutInputs */
/** @typedef {{}} Role_Desktop_NoneInputs */
/** @typedef {{}} Role_Desktop_QuestionInputs */
/** @typedef {{}} Role_FrameworkInputs */
/** @typedef {{}} Role_Framework_AboutInputs */
/** @typedef {{}} Role_Framework_NoneInputs */
/** @typedef {{}} Role_Framework_QuestionInputs */
/** @typedef {{}} Runs_In_BrowserInputs */
/** @typedef {{}} Runs_In_ElectronInputs */
/** @typedef {{}} Runtime_AboutInputs */
/** @typedef {{}} Runtime_NoneInputs */
/** @typedef {{}} Runtime_QuestionInputs */
/** @typedef {{}} Search_DocsInputs */
/** @typedef {{ query: NonNullable<unknown> }} Search_EmptyInputs */
/** @typedef {{}} Search_Hint_MoveInputs */
/** @typedef {{}} Search_Hint_OpenInputs */
/** @typedef {{}} Search_PlaceholderInputs */
/** @typedef {{}} Search_Placeholder_ShortInputs */
/** @typedef {{}} Search_SearchingInputs */
/** @typedef {{}} Studio_StackInputs */
/** @typedef {{}} Tests_Scope_ApiInputs */
/** @typedef {{}} Tests_Scope_Api_IntegrationInputs */
/** @typedef {{}} Tests_Scope_StaticInputs */
/** @typedef {{}} Tests_Scope_WebInputs */
/** @typedef {{}} Tests_Scope_Web_IntegrationInputs */
/** @typedef {{}} Tool_AnalyzeInputs */
/** @typedef {{}} Tool_BuildInputs */
/** @typedef {{}} Tool_BuiltinInputs */
/** @typedef {{}} Tool_CheckInputs */
/** @typedef {{}} Tool_DevInputs */
/** @typedef {{}} Tool_E2eInputs */
/** @typedef {{}} Tool_TestInputs */
/** @typedef {{}} Tool_Test_IntegrationInputs */
/** @typedef {{}} Toolchain_ScopeInputs */
/** @typedef {{}} Ultracite_ScopeInputs */
/** @typedef {{ when: NonNullable<unknown> }} VerifiedInputs */
/** @typedef {{}} Verified_PassedInputs */
/** @typedef {{ name: NonNullable<unknown> }} Visit_SiteInputs */
/** @typedef {{}} VisitorsInputs */
/** @typedef {{}} Viz_All_PassedInputs */
/** @typedef {{ gate: NonNullable<unknown> }} Viz_Caught_ByInputs */
/** @typedef {{}} Viz_Docker_CodeInputs */
/** @typedef {{}} Viz_Docker_ContainersInputs */
/** @typedef {{}} Viz_Docker_ImageInputs */
/** @typedef {{}} Viz_Docker_NoneInputs */
/** @typedef {{}} Viz_Fix_RerunInputs */
/** @typedef {{}} Viz_Gate_E2eInputs */
/** @typedef {{}} Viz_Gate_IntegrationInputs */
/** @typedef {{}} Viz_Gate_LintInputs */
/** @typedef {{}} Viz_Gate_TypesInputs */
/** @typedef {{}} Viz_Group_FoundationInputs */
/** @typedef {{}} Viz_How_KeptInputs */
/** @typedef {{}} Viz_How_MergedInputs */
/** @typedef {{}} Viz_Kind_DefaultInputs */
/** @typedef {{}} Viz_Kind_FlagInputs */
/** @typedef {{}} Viz_Kind_FollowsInputs */
/** @typedef {{}} Viz_Kind_OptionsInputs */
/** @typedef {{}} Viz_Layer_AppInputs */
/** @typedef {{}} Viz_Layer_RuntimeInputs */
/** @typedef {{}} Viz_Layer_StartInputs */
/** @typedef {{}} Viz_Layer_SystemInputs */
/** @typedef {{}} Viz_NextInputs */
/** @typedef {{}} Viz_Node_BrowserInputs */
/** @typedef {{}} Viz_Node_DatabaseInputs */
/** @typedef {{}} Viz_Node_ServerInputs */
/** @typedef {{}} Viz_Node_UserInputs */
/** @typedef {{}} Viz_Phase_DoneInputs */
/** @typedef {{}} Viz_Phase_DownloadInputs */
/** @typedef {{}} Viz_Phase_FetchInputs */
/** @typedef {{}} Viz_Phase_HydrateInputs */
/** @typedef {{}} Viz_Phase_ServerInputs */
/** @typedef {{}} Viz_Plant_BugInputs */
/** @typedef {{}} Viz_PrevInputs */
/** @typedef {{}} Viz_ReloadInputs */
/** @typedef {{}} Viz_Render_CaptionInputs */
/** @typedef {{}} Viz_Render_SpaInputs */
/** @typedef {{}} Viz_Render_SsrInputs */
/** @typedef {{}} Viz_Render_StatusInputs */
/** @typedef {{}} Viz_ReplayInputs */
/** @typedef {{}} Viz_RestoreInputs */
/** @typedef {{}} Viz_SeenInputs */
/** @typedef {{ current: NonNullable<unknown>, total: NonNullable<unknown> }} Viz_StepInputs */
/** @typedef {{ count: NonNullable<unknown> }} Viz_Test_CountInputs */
/** @typedef {{}} Viz_Test_E2eInputs */
/** @typedef {{}} Viz_Test_IntegrationInputs */
/** @typedef {{}} Viz_Test_UnitInputs */
/** @typedef {{}} Viz_Tests_CaptionInputs */
/** @typedef {{}} Viz_Tests_Caption_BrokenInputs */
/** @typedef {{ count: NonNullable<unknown> }} Viz_Tests_CaughtInputs */
/** @typedef {{}} Viz_Tests_GreenInputs */
/** @typedef {{ count: NonNullable<unknown> }} Viz_Tests_MoreInputs */
/** @typedef {{}} Viz_Tests_OursInputs */
/** @typedef {{}} Viz_Tests_ShippedInputs */
/** @typedef {{}} Viz_Tests_TypicalInputs */
/** @typedef {{}} Viz_UsableInputs */
/** @typedef {{ count: NonNullable<unknown>, names: NonNullable<unknown>, capabilities: NonNullable<unknown> }} Why_IncludedInputs */
import * as __en from "./en.js"
import * as __zh from "./zh.js"
/**
* | output |
* | --- |
* | "Add API" |
*
* @param {Add_ApiInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const add_api = /** @type {((inputs?: Add_ApiInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Add_ApiInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.add_api(inputs)
	return __en.add_api(inputs)
});
/**
* | output |
* | --- |
* | "Add auth" |
*
* @param {Add_AuthInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const add_auth = /** @type {((inputs?: Add_AuthInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Add_AuthInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.add_auth(inputs)
	return __en.add_auth(inputs)
});
/**
* | output |
* | --- |
* | "Add backend" |
*
* @param {Add_BackendInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const add_backend = /** @type {((inputs?: Add_BackendInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Add_BackendInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.add_backend(inputs)
	return __en.add_backend(inputs)
});
/**
* | output |
* | --- |
* | "Add database" |
*
* @param {Add_DatabaseInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const add_database = /** @type {((inputs?: Add_DatabaseInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Add_DatabaseInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.add_database(inputs)
	return __en.add_database(inputs)
});
/**
* | output |
* | --- |
* | "Add deployment" |
*
* @param {Add_DeploymentInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const add_deployment = /** @type {((inputs?: Add_DeploymentInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Add_DeploymentInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.add_deployment(inputs)
	return __en.add_deployment(inputs)
});
/**
* | output |
* | --- |
* | "Add desktop app" |
*
* @param {Add_DesktopInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const add_desktop = /** @type {((inputs?: Add_DesktopInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Add_DesktopInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.add_desktop(inputs)
	return __en.add_desktop(inputs)
});
/**
* | output |
* | --- |
* | "Add frontend" |
*
* @param {Add_FrameworkInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const add_framework = /** @type {((inputs?: Add_FrameworkInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Add_FrameworkInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.add_framework(inputs)
	return __en.add_framework(inputs)
});
/**
* | output |
* | --- |
* | "default" |
*
* @param {Addon_DefaultInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const addon_default = /** @type {((inputs?: Addon_DefaultInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addon_DefaultInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.addon_default(inputs)
	return __en.addon_default(inputs)
});
/**
* | output |
* | --- |
* | "Finds unused files, exports, dependencies, and catalog entries" |
*
* @param {Addon_Desc_KnipInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const addon_desc_knip = /** @type {((inputs?: Addon_Desc_KnipInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addon_Desc_KnipInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.addon_desc_knip(inputs)
	return __en.addon_desc_knip(inputs)
});
/**
* | output |
* | --- |
* | "Lint and formatting presets with framework rules and AI code quality checks" |
*
* @param {Addon_Desc_UltraciteInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const addon_desc_ultracite = /** @type {((inputs?: Addon_Desc_UltraciteInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addon_Desc_UltraciteInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.addon_desc_ultracite(inputs)
	return __en.addon_desc_ultracite(inputs)
});
/**
* | output |
* | --- |
* | "Extensions" |
*
* @param {AddonsInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const addons = /** @type {((inputs?: AddonsInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<AddonsInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.addons(inputs)
	return __en.addons(inputs)
});
/**
* | output |
* | --- |
* | "API clients" |
*
* @param {Api_ClientsInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const api_clients = /** @type {((inputs?: Api_ClientsInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Api_ClientsInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.api_clients(inputs)
	return __en.api_clients(inputs)
});
/**
* | output |
* | --- |
* | "a frontend framework" |
*
* @param {Cap_Frontend_FrameworkInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const cap_frontend_framework = /** @type {((inputs?: Cap_Frontend_FrameworkInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Cap_Frontend_FrameworkInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.cap_frontend_framework(inputs)
	return __en.cap_frontend_framework(inputs)
});
/**
* | output |
* | --- |
* | "a full-stack framework" |
*
* @param {Cap_Fullstack_FrameworkInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const cap_fullstack_framework = /** @type {((inputs?: Cap_Fullstack_FrameworkInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Cap_Fullstack_FrameworkInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.cap_fullstack_framework(inputs)
	return __en.cap_fullstack_framework(inputs)
});
/**
* | output |
* | --- |
* | "a Hono server" |
*
* @param {Cap_Hono_ServerInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const cap_hono_server = /** @type {((inputs?: Cap_Hono_ServerInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Cap_Hono_ServerInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.cap_hono_server(inputs)
	return __en.cap_hono_server(inputs)
});
/**
* | output |
* | --- |
* | "an HTTP server" |
*
* @param {Cap_Http_ServerInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const cap_http_server = /** @type {((inputs?: Cap_Http_ServerInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Cap_Http_ServerInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.cap_http_server(inputs)
	return __en.cap_http_server(inputs)
});
/**
* | output |
* | --- |
* | "a Node.js-compatible runtime" |
*
* @param {Cap_Node_RuntimeInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const cap_node_runtime = /** @type {((inputs?: Cap_Node_RuntimeInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Cap_Node_RuntimeInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.cap_node_runtime(inputs)
	return __en.cap_node_runtime(inputs)
});
/**
* | output |
* | --- |
* | "React" |
*
* @param {Cap_ReactInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const cap_react = /** @type {((inputs?: Cap_ReactInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Cap_ReactInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.cap_react(inputs)
	return __en.cap_react(inputs)
});
/**
* | output |
* | --- |
* | "a router" |
*
* @param {Cap_RouterInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const cap_router = /** @type {((inputs?: Cap_RouterInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Cap_RouterInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.cap_router(inputs)
	return __en.cap_router(inputs)
});
/**
* | output |
* | --- |
* | "a typed RPC layer" |
*
* @param {Cap_RpcInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const cap_rpc = /** @type {((inputs?: Cap_RpcInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Cap_RpcInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.cap_rpc(inputs)
	return __en.cap_rpc(inputs)
});
/**
* | output |
* | --- |
* | "a single-page app" |
*
* @param {Cap_Single_Page_AppInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const cap_single_page_app = /** @type {((inputs?: Cap_Single_Page_AppInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Cap_Single_Page_AppInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.cap_single_page_app(inputs)
	return __en.cap_single_page_app(inputs)
});
/**
* | output |
* | --- |
* | "a SQL database" |
*
* @param {Cap_Sql_DatabaseInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const cap_sql_database = /** @type {((inputs?: Cap_Sql_DatabaseInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Cap_Sql_DatabaseInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.cap_sql_database(inputs)
	return __en.cap_sql_database(inputs)
});
/**
* | output |
* | --- |
* | "a SQL ORM" |
*
* @param {Cap_Sql_OrmInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const cap_sql_orm = /** @type {((inputs?: Cap_Sql_OrmInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Cap_Sql_OrmInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.cap_sql_orm(inputs)
	return __en.cap_sql_orm(inputs)
});
/**
* | output |
* | --- |
* | "a UI component library" |
*
* @param {Cap_Ui_ComponentsInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const cap_ui_components = /** @type {((inputs?: Cap_Ui_ComponentsInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Cap_Ui_ComponentsInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.cap_ui_components(inputs)
	return __en.cap_ui_components(inputs)
});
/**
* | output |
* | --- |
* | "Fix and re-check" |
*
* @param {Change_Demo_ApplyInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const change_demo_apply = /** @type {((inputs?: Change_Demo_ApplyInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Change_Demo_ApplyInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.change_demo_apply(inputs)
	return __en.change_demo_apply(inputs)
});
/**
* | output |
* | --- |
* | "Check failed" |
*
* @param {Change_Demo_FailedInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const change_demo_failed = /** @type {((inputs?: Change_Demo_FailedInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Change_Demo_FailedInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.change_demo_failed(inputs)
	return __en.change_demo_failed(inputs)
});
/**
* | output |
* | --- |
* | "Example project · Hono + oRPC + Better Auth" |
*
* @param {Change_Demo_LabelInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const change_demo_label = /** @type {((inputs?: Change_Demo_LabelInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Change_Demo_LabelInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.change_demo_label(inputs)
	return __en.change_demo_label(inputs)
});
/**
* | output |
* | --- |
* | "Pre-recorded output" |
*
* @param {Change_Demo_NoteInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const change_demo_note = /** @type {((inputs?: Change_Demo_NoteInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Change_Demo_NoteInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.change_demo_note(inputs)
	return __en.change_demo_note(inputs)
});
/**
* | output |
* | --- |
* | "Check passed" |
*
* @param {Change_Demo_PassedInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const change_demo_passed = /** @type {((inputs?: Change_Demo_PassedInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Change_Demo_PassedInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.change_demo_passed(inputs)
	return __en.change_demo_passed(inputs)
});
/**
* | output |
* | --- |
* | "Not run yet" |
*
* @param {Change_Demo_PendingInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const change_demo_pending = /** @type {((inputs?: Change_Demo_PendingInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Change_Demo_PendingInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.change_demo_pending(inputs)
	return __en.change_demo_pending(inputs)
});
/**
* | output |
* | --- |
* | "Reset" |
*
* @param {Change_Demo_ResetInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const change_demo_reset = /** @type {((inputs?: Change_Demo_ResetInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Change_Demo_ResetInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.change_demo_reset(inputs)
	return __en.change_demo_reset(inputs)
});
/**
* | output |
* | --- |
* | "Run check" |
*
* @param {Change_Demo_RunInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const change_demo_run = /** @type {((inputs?: Change_Demo_RunInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Change_Demo_RunInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.change_demo_run(inputs)
	return __en.change_demo_run(inputs)
});
/**
* | output |
* | --- |
* | "Lint reports an unhandled promise that must be awaited or have a rejection handler." |
*
* @param {Change_Quality_CheckInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const change_quality_check = /** @type {((inputs?: Change_Quality_CheckInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Change_Quality_CheckInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.change_quality_check(inputs)
	return __en.change_quality_check(inputs)
});
/**
* | output |
* | --- |
* | "A todo submission refreshes the list without handling the returned promise." |
*
* @param {Change_Quality_DraftInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const change_quality_draft = /** @type {((inputs?: Change_Quality_DraftInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Change_Quality_DraftInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.change_quality_draft(inputs)
	return __en.change_quality_draft(inputs)
});
/**
* | output |
* | --- |
* | "Await the refresh so the caller can handle a failure." |
*
* @param {Change_Quality_FixInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const change_quality_fix = /** @type {((inputs?: Change_Quality_FixInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Change_Quality_FixInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.change_quality_fix(inputs)
	return __en.change_quality_fix(inputs)
});
/**
* | output |
* | --- |
* | "Check" |
*
* @param {Change_Stage_CheckInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const change_stage_check = /** @type {((inputs?: Change_Stage_CheckInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Change_Stage_CheckInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.change_stage_check(inputs)
	return __en.change_stage_check(inputs)
});
/**
* | output |
* | --- |
* | "Change" |
*
* @param {Change_Stage_DraftInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const change_stage_draft = /** @type {((inputs?: Change_Stage_DraftInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Change_Stage_DraftInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.change_stage_draft(inputs)
	return __en.change_stage_draft(inputs)
});
/**
* | output |
* | --- |
* | "Fix" |
*
* @param {Change_Stage_FixInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const change_stage_fix = /** @type {((inputs?: Change_Stage_FixInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Change_Stage_FixInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.change_stage_fix(inputs)
	return __en.change_stage_fix(inputs)
});
/**
* | output |
* | --- |
* | "After Alice creates a todo, Bob’s list should be empty. The integration test detects another account’s data." |
*
* @param {Change_Tests_CheckInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const change_tests_check = /** @type {((inputs?: Change_Tests_CheckInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Change_Tests_CheckInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.change_tests_check(inputs)
	return __en.change_tests_check(inputs)
});
/**
* | output |
* | --- |
* | "The list query omits the user filter and can return another account’s todos." |
*
* @param {Change_Tests_DraftInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const change_tests_draft = /** @type {((inputs?: Change_Tests_DraftInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Change_Tests_DraftInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.change_tests_draft(inputs)
	return __en.change_tests_draft(inputs)
});
/**
* | output |
* | --- |
* | "Filtering by the current user keeps the two accounts’ data separate." |
*
* @param {Change_Tests_FixInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const change_tests_fix = /** @type {((inputs?: Change_Tests_FixInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Change_Tests_FixInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.change_tests_fix(inputs)
	return __en.change_tests_fix(inputs)
});
/**
* | output |
* | --- |
* | "Type checking reports the field that no longer exists." |
*
* @param {Change_Types_CheckInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const change_types_check = /** @type {((inputs?: Change_Types_CheckInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Change_Types_CheckInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.change_types_check(inputs)
	return __en.change_types_check(inputs)
});
/**
* | output |
* | --- |
* | "The API now returns name, but the page still reads title." |
*
* @param {Change_Types_DraftInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const change_types_draft = /** @type {((inputs?: Change_Types_DraftInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Change_Types_DraftInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.change_types_draft(inputs)
	return __en.change_types_draft(inputs)
});
/**
* | output |
* | --- |
* | "The page reads name, matching the API response." |
*
* @param {Change_Types_FixInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const change_types_fix = /** @type {((inputs?: Change_Types_FixInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Change_Types_FixInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.change_types_fix(inputs)
	return __en.change_types_fix(inputs)
});
/**
* | output |
* | --- |
* | "Close" |
*
* @param {CloseInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const close = /** @type {((inputs?: CloseInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<CloseInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.close(inputs)
	return __en.close(inputs)
});
/**
* | output |
* | --- |
* | "Close file" |
*
* @param {Close_FileInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const close_file = /** @type {((inputs?: Close_FileInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Close_FileInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.close_file(inputs)
	return __en.close_file(inputs)
});
/**
* | output |
* | --- |
* | "Copy command" |
*
* @param {Copy_CommandInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const copy_command = /** @type {((inputs?: Copy_CommandInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Copy_CommandInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.copy_command(inputs)
	return __en.copy_command(inputs)
});
/**
* | output |
* | --- |
* | "Copy file" |
*
* @param {Copy_FileInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const copy_file = /** @type {((inputs?: Copy_FileInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Copy_FileInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.copy_file(inputs)
	return __en.copy_file(inputs)
});
/**
* | output |
* | --- |
* | "Prompt copied" |
*
* @param {Create_Agent_CopiedInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const create_agent_copied = /** @type {((inputs?: Create_Agent_CopiedInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Create_Agent_CopiedInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.create_agent_copied(inputs)
	return __en.create_agent_copied(inputs)
});
/**
* | output |
* | --- |
* | "Copy prompt" |
*
* @param {Create_Agent_CopyInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const create_agent_copy = /** @type {((inputs?: Create_Agent_CopyInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Create_Agent_CopyInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.create_agent_copy(inputs)
	return __en.create_agent_copy(inputs)
});
/**
* | output |
* | --- |
* | "Copy this prompt to your coding agent. It includes the stack and extensions selected here." |
*
* @param {Create_Agent_HintInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const create_agent_hint = /** @type {((inputs?: Create_Agent_HintInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Create_Agent_HintInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.create_agent_hint(inputs)
	return __en.create_agent_hint(inputs)
});
/**
* | output |
* | --- |
* | "Project creation prompt" |
*
* @param {Create_Agent_PreviewInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const create_agent_preview = /** @type {((inputs?: Create_Agent_PreviewInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Create_Agent_PreviewInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.create_agent_preview(inputs)
	return __en.create_agent_preview(inputs)
});
/**
* | output |
* | --- |
* | "Run this command, read its complete output, and follow the skill: {skill} Create the project with these selected options: {command}" |
*
* @param {Create_Agent_PromptInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const create_agent_prompt = /** @type {((inputs: Create_Agent_PromptInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Create_Agent_PromptInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.create_agent_prompt(inputs)
	return __en.create_agent_prompt(inputs)
});
/**
* | output |
* | --- |
* | "Create" |
*
* @param {Create_ItInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const create_it = /** @type {((inputs?: Create_ItInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Create_ItInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.create_it(inputs)
	return __en.create_it(inputs)
});
/**
* | output |
* | --- |
* | "Creation mode" |
*
* @param {Create_ModeInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const create_mode = /** @type {((inputs?: Create_ModeInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Create_ModeInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.create_mode(inputs)
	return __en.create_mode(inputs)
});
/**
* | output |
* | --- |
* | "Terminal" |
*
* @param {Create_TerminalInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const create_terminal = /** @type {((inputs?: Create_TerminalInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Create_TerminalInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.create_terminal(inputs)
	return __en.create_terminal(inputs)
});
/**
* | output |
* | --- |
* | "current" |
*
* @param {CurrentInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const current = /** @type {((inputs?: CurrentInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<CurrentInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.current(inputs)
	return __en.current(inputs)
});
/**
* | output |
* | --- |
* | "{name} image" |
*
* @param {Deployment_ImageInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const deployment_image = /** @type {((inputs: Deployment_ImageInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Deployment_ImageInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.deployment_image(inputs)
	return __en.deployment_image(inputs)
});
/**
* | output |
* | --- |
* | "{name} image, with PostgreSQL via Compose" |
*
* @param {Deployment_PostgresInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const deployment_postgres = /** @type {((inputs: Deployment_PostgresInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Deployment_PostgresInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.deployment_postgres(inputs)
	return __en.deployment_postgres(inputs)
});
/**
* | output |
* | --- |
* | "Email and password sign-in, with sessions in the database" |
*
* @param {Desc_Better_AuthInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const desc_better_auth = /** @type {((inputs?: Desc_Better_AuthInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Desc_Better_AuthInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.desc_better_auth(inputs)
	return __en.desc_better_auth(inputs)
});
/**
* | output |
* | --- |
* | "Bun runtime for the Hono server; web frameworks and tools stay on Node.js" |
*
* @param {Desc_BunInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const desc_bun = /** @type {((inputs?: Desc_BunInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Desc_BunInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.desc_bun(inputs)
	return __en.desc_bun(inputs)
});
/**
* | output |
* | --- |
* | "Production Dockerfile and Docker Compose" |
*
* @param {Desc_DockerInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const desc_docker = /** @type {((inputs?: Desc_DockerInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Desc_DockerInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.desc_docker(inputs)
	return __en.desc_docker(inputs)
});
/**
* | output |
* | --- |
* | "Drizzle ORM v1 with SQL migrations" |
*
* @param {Desc_DrizzleInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const desc_drizzle = /** @type {((inputs?: Desc_DrizzleInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Desc_DrizzleInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.desc_drizzle(inputs)
	return __en.desc_drizzle(inputs)
});
/**
* | output |
* | --- |
* | "Desktop app around the web app, packaged with electron-builder" |
*
* @param {Desc_ElectronInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const desc_electron = /** @type {((inputs?: Desc_ElectronInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Desc_ElectronInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.desc_electron(inputs)
	return __en.desc_electron(inputs)
});
/**
* | output |
* | --- |
* | "Standalone API server built on Hono" |
*
* @param {Desc_HonoInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const desc_hono = /** @type {((inputs?: Desc_HonoInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Desc_HonoInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.desc_hono(inputs)
	return __en.desc_hono(inputs)
});
/**
* | output |
* | --- |
* | "Full-stack React with the App Router and React Compiler" |
*
* @param {Desc_NextInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const desc_next = /** @type {((inputs?: Desc_NextInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Desc_NextInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.desc_next(inputs)
	return __en.desc_next(inputs)
});
/**
* | output |
* | --- |
* | "Node.js 24" |
*
* @param {Desc_NodeInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const desc_node = /** @type {((inputs?: Desc_NodeInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Desc_NodeInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.desc_node(inputs)
	return __en.desc_node(inputs)
});
/**
* | output |
* | --- |
* | "REST API with @hono/zod-openapi and a typed client" |
*
* @param {Desc_OpenapiInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const desc_openapi = /** @type {((inputs?: Desc_OpenapiInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Desc_OpenapiInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.desc_openapi(inputs)
	return __en.desc_openapi(inputs)
});
/**
* | output |
* | --- |
* | "End-to-end type-safe RPC with OpenAPI docs" |
*
* @param {Desc_OrpcInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const desc_orpc = /** @type {((inputs?: Desc_OrpcInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Desc_OrpcInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.desc_orpc(inputs)
	return __en.desc_orpc(inputs)
});
/**
* | output |
* | --- |
* | "PostgreSQL server, run by Docker Compose in development" |
*
* @param {Desc_PostgresInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const desc_postgres = /** @type {((inputs?: Desc_PostgresInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Desc_PostgresInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.desc_postgres(inputs)
	return __en.desc_postgres(inputs)
});
/**
* | output |
* | --- |
* | "React 19 with TanStack Query" |
*
* @param {Desc_ReactInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const desc_react = /** @type {((inputs?: Desc_ReactInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Desc_ReactInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.desc_react(inputs)
	return __en.desc_react(inputs)
});
/**
* | output |
* | --- |
* | "API routes served by the frontend framework, beside its pages" |
*
* @param {Desc_SelfInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const desc_self = /** @type {((inputs?: Desc_SelfInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Desc_SelfInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.desc_self(inputs)
	return __en.desc_self(inputs)
});
/**
* | output |
* | --- |
* | "Base UI components in a shared UI package" |
*
* @param {Desc_ShadcnInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const desc_shadcn = /** @type {((inputs?: Desc_ShadcnInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Desc_ShadcnInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.desc_shadcn(inputs)
	return __en.desc_shadcn(inputs)
});
/**
* | output |
* | --- |
* | "Client-rendered React app built with Vite" |
*
* @param {Desc_SpaInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const desc_spa = /** @type {((inputs?: Desc_SpaInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Desc_SpaInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.desc_spa(inputs)
	return __en.desc_spa(inputs)
});
/**
* | output |
* | --- |
* | "Single-file database via node:sqlite" |
*
* @param {Desc_SqliteInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const desc_sqlite = /** @type {((inputs?: Desc_SqliteInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Desc_SqliteInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.desc_sqlite(inputs)
	return __en.desc_sqlite(inputs)
});
/**
* | output |
* | --- |
* | "Type-safe file-based routing" |
*
* @param {Desc_Tanstack_RouterInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const desc_tanstack_router = /** @type {((inputs?: Desc_Tanstack_RouterInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Desc_Tanstack_RouterInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.desc_tanstack_router(inputs)
	return __en.desc_tanstack_router(inputs)
});
/**
* | output |
* | --- |
* | "Full-stack React with SSR, server routes, and server functions" |
*
* @param {Desc_Tanstack_StartInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const desc_tanstack_start = /** @type {((inputs?: Desc_Tanstack_StartInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Desc_Tanstack_StartInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.desc_tanstack_start(inputs)
	return __en.desc_tanstack_start(inputs)
});
/**
* | output |
* | --- |
* | "Unified toolchain for dev, build, test, lint, and format" |
*
* @param {Desc_Vite_PlusInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const desc_vite_plus = /** @type {((inputs?: Desc_Vite_PlusInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Desc_Vite_PlusInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.desc_vite_plus(inputs)
	return __en.desc_vite_plus(inputs)
});
/**
* | output |
* | --- |
* | "API integration tests and browser end-to-end tests" |
*
* @param {Desc_Vitest_PlaywrightInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const desc_vitest_playwright = /** @type {((inputs?: Desc_Vitest_PlaywrightInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Desc_Vitest_PlaywrightInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.desc_vitest_playwright(inputs)
	return __en.desc_vitest_playwright(inputs)
});
/**
* | output |
* | --- |
* | "Loads" |
*
* @param {Desktop_DistInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const desktop_dist = /** @type {((inputs?: Desktop_DistInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Desktop_DistInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.desktop_dist(inputs)
	return __en.desktop_dist(inputs)
});
/**
* | output |
* | --- |
* | "apps/web/dist" |
*
* @param {Desktop_Dist_PillInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const desktop_dist_pill = /** @type {((inputs?: Desktop_Dist_PillInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Desktop_Dist_PillInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.desktop_dist_pill(inputs)
	return __en.desktop_dist_pill(inputs)
});
/**
* | output |
* | --- |
* | "Forwards" |
*
* @param {Desktop_ProxyInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const desktop_proxy = /** @type {((inputs?: Desktop_ProxyInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Desktop_ProxyInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.desktop_proxy(inputs)
	return __en.desktop_proxy(inputs)
});
/**
* | output |
* | --- |
* | "API proxy" |
*
* @param {Desktop_Proxy_PillInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const desktop_proxy_pill = /** @type {((inputs?: Desktop_Proxy_PillInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Desktop_Proxy_PillInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.desktop_proxy_pill(inputs)
	return __en.desktop_proxy_pill(inputs)
});
/**
* | output |
* | --- |
* | "Link to this section" |
*
* @param {Docs_AnchorInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const docs_anchor = /** @type {((inputs?: Docs_AnchorInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Docs_AnchorInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.docs_anchor(inputs)
	return __en.docs_anchor(inputs)
});
/**
* | output |
* | --- |
* | "Back to the docs" |
*
* @param {Docs_Back_HomeInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const docs_back_home = /** @type {((inputs?: Docs_Back_HomeInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Docs_Back_HomeInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.docs_back_home(inputs)
	return __en.docs_back_home(inputs)
});
/**
* | output |
* | --- |
* | "Copy code" |
*
* @param {Docs_Copy_CodeInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const docs_copy_code = /** @type {((inputs?: Docs_Copy_CodeInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Docs_Copy_CodeInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.docs_copy_code(inputs)
	return __en.docs_copy_code(inputs)
});
/**
* | output |
* | --- |
* | "{page} · vibestart docs" |
*
* @param {Docs_Document_TitleInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const docs_document_title = /** @type {((inputs: Docs_Document_TitleInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Docs_Document_TitleInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.docs_document_title(inputs)
	return __en.docs_document_title(inputs)
});
/**
* | output |
* | --- |
* | "Edit this page on GitHub" |
*
* @param {Docs_EditInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const docs_edit = /** @type {((inputs?: Docs_EditInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Docs_EditInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.docs_edit(inputs)
	return __en.docs_edit(inputs)
});
/**
* | output |
* | --- |
* | "Docs" |
*
* @param {Docs_NavInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const docs_nav = /** @type {((inputs?: Docs_NavInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Docs_NavInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.docs_nav(inputs)
	return __en.docs_nav(inputs)
});
/**
* | output |
* | --- |
* | "Next" |
*
* @param {Docs_NextInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const docs_next = /** @type {((inputs?: Docs_NextInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Docs_NextInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.docs_next(inputs)
	return __en.docs_next(inputs)
});
/**
* | output |
* | --- |
* | "On this page" |
*
* @param {Docs_On_This_PageInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const docs_on_this_page = /** @type {((inputs?: Docs_On_This_PageInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Docs_On_This_PageInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.docs_on_this_page(inputs)
	return __en.docs_on_this_page(inputs)
});
/**
* | output |
* | --- |
* | "More pages" |
*
* @param {Docs_PaginationInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const docs_pagination = /** @type {((inputs?: Docs_PaginationInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Docs_PaginationInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.docs_pagination(inputs)
	return __en.docs_pagination(inputs)
});
/**
* | output |
* | --- |
* | "Previous" |
*
* @param {Docs_PreviousInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const docs_previous = /** @type {((inputs?: Docs_PreviousInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Docs_PreviousInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.docs_previous(inputs)
	return __en.docs_previous(inputs)
});
/**
* | output |
* | --- |
* | "Pick your stack, run one command, and get a modern full-stack TypeScript project. Built on Vite+, with engineering rules your AI can read; every combination ..." |
*
* @param {Document_DescriptionInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const document_description = /** @type {((inputs?: Document_DescriptionInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Document_DescriptionInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.document_description(inputs)
	return __en.document_description(inputs)
});
/**
* | output |
* | --- |
* | "vibestart · AI Native full-stack scaffolding" |
*
* @param {Document_TitleInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const document_title = /** @type {((inputs?: Document_TitleInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Document_TitleInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.document_title(inputs)
	return __en.document_title(inputs)
});
/**
* | output |
* | --- |
* | "Electron main process" |
*
* @param {Electron_ProcessInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const electron_process = /** @type {((inputs?: Electron_ProcessInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Electron_ProcessInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.electron_process(inputs)
	return __en.electron_process(inputs)
});
/**
* | output |
* | --- |
* | "Engineering" |
*
* @param {Engineering_CapabilitiesInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const engineering_capabilities = /** @type {((inputs?: Engineering_CapabilitiesInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Engineering_CapabilitiesInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.engineering_capabilities(inputs)
	return __en.engineering_capabilities(inputs)
});
/**
* | output |
* | --- |
* | "Choose the capabilities you need. Select several without changing the existing test flow." |
*
* @param {Extensions_AboutInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const extensions_about = /** @type {((inputs?: Extensions_AboutInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Extensions_AboutInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.extensions_about(inputs)
	return __en.extensions_about(inputs)
});
/**
* | output |
* | --- |
* | "None selected" |
*
* @param {Extensions_NoneInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const extensions_none = /** @type {((inputs?: Extensions_NoneInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Extensions_NoneInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.extensions_none(inputs)
	return __en.extensions_none(inputs)
});
/**
* | countPlural | output |
* | --- | --- |
* | "one" | "{count} file" |
* | "other" | "{count} files" |
*
* @param {File_CountInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const file_count = /** @type {((inputs: File_CountInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<File_CountInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.file_count(inputs)
	return __en.file_count(inputs)
});
/**
* | output |
* | --- |
* | "For apps where users have accounts." |
*
* @param {Fit_Better_AuthInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const fit_better_auth = /** @type {((inputs?: Fit_Better_AuthInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Fit_Better_AuthInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.fit_better_auth(inputs)
	return __en.fit_better_auth(inputs)
});
/**
* | output |
* | --- |
* | "Use Bun to run Hono, with TypeScript and environment files built in." |
*
* @param {Fit_BunInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const fit_bun = /** @type {((inputs?: Fit_BunInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Fit_BunInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.fit_bun(inputs)
	return __en.fit_bun(inputs)
});
/**
* | output |
* | --- |
* | "For your own server or any container host." |
*
* @param {Fit_DockerInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const fit_docker = /** @type {((inputs?: Fit_DockerInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Fit_DockerInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.fit_docker(inputs)
	return __en.fit_docker(inputs)
});
/**
* | output |
* | --- |
* | "For the same web app in its own window, packaged as an installer." |
*
* @param {Fit_ElectronInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const fit_electron = /** @type {((inputs?: Fit_ElectronInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Fit_ElectronInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.fit_electron(inputs)
	return __en.fit_electron(inputs)
});
/**
* | output |
* | --- |
* | "For an API that mobile apps or other services share." |
*
* @param {Fit_HonoInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const fit_hono = /** @type {((inputs?: Fit_HonoInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Fit_HonoInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.fit_hono(inputs)
	return __en.fit_hono(inputs)
});
/**
* | output |
* | --- |
* | "For SEO-focused sites, on the most popular React framework." |
*
* @param {Fit_NextInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const fit_next = /** @type {((inputs?: Fit_NextInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Fit_NextInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.fit_next(inputs)
	return __en.fit_next(inputs)
});
/**
* | output |
* | --- |
* | "Keep the current Node.js runtime for Hono." |
*
* @param {Fit_NodeInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const fit_node = /** @type {((inputs?: Fit_NodeInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Fit_NodeInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.fit_node(inputs)
	return __en.fit_node(inputs)
});
/**
* | output |
* | --- |
* | "For designing the API yourself." |
*
* @param {Fit_None_ApiInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const fit_none_api = /** @type {((inputs?: Fit_None_ApiInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Fit_None_ApiInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.fit_none_api(inputs)
	return __en.fit_none_api(inputs)
});
/**
* | output |
* | --- |
* | "For public sites with no sign-in." |
*
* @param {Fit_None_AuthInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const fit_none_auth = /** @type {((inputs?: Fit_None_AuthInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Fit_None_AuthInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.fit_none_auth(inputs)
	return __en.fit_none_auth(inputs)
});
/**
* | output |
* | --- |
* | "For static sites with no data." |
*
* @param {Fit_None_BackendInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const fit_none_backend = /** @type {((inputs?: Fit_None_BackendInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Fit_None_BackendInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.fit_none_backend(inputs)
	return __en.fit_none_backend(inputs)
});
/**
* | output |
* | --- |
* | "For apps that store nothing." |
*
* @param {Fit_None_DatabaseInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const fit_none_database = /** @type {((inputs?: Fit_None_DatabaseInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Fit_None_DatabaseInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.fit_none_database(inputs)
	return __en.fit_none_database(inputs)
});
/**
* | output |
* | --- |
* | "For choosing hosting later." |
*
* @param {Fit_None_DeploymentInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const fit_none_deployment = /** @type {((inputs?: Fit_None_DeploymentInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Fit_None_DeploymentInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.fit_none_deployment(inputs)
	return __en.fit_none_deployment(inputs)
});
/**
* | output |
* | --- |
* | "For an app that runs in the browser only." |
*
* @param {Fit_None_DesktopInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const fit_none_desktop = /** @type {((inputs?: Fit_None_DesktopInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Fit_None_DesktopInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.fit_none_desktop(inputs)
	return __en.fit_none_desktop(inputs)
});
/**
* | output |
* | --- |
* | "For an API that apps or scripts call." |
*
* @param {Fit_None_FrameworkInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const fit_none_framework = /** @type {((inputs?: Fit_None_FrameworkInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Fit_None_FrameworkInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.fit_none_framework(inputs)
	return __en.fit_none_framework(inputs)
});
/**
* | output |
* | --- |
* | "For a standard REST API that others call." |
*
* @param {Fit_OpenapiInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const fit_openapi = /** @type {((inputs?: Fit_OpenapiInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Fit_OpenapiInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.fit_openapi(inputs)
	return __en.fit_openapi(inputs)
});
/**
* | output |
* | --- |
* | "For an API only your own frontend calls." |
*
* @param {Fit_OrpcInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const fit_orpc = /** @type {((inputs?: Fit_OrpcInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Fit_OrpcInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.fit_orpc(inputs)
	return __en.fit_orpc(inputs)
});
/**
* | output |
* | --- |
* | "For production apps with many users." |
*
* @param {Fit_PostgresInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const fit_postgres = /** @type {((inputs?: Fit_PostgresInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Fit_PostgresInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.fit_postgres(inputs)
	return __en.fit_postgres(inputs)
});
/**
* | output |
* | --- |
* | "For one app to build and deploy. The simplest setup." |
*
* @param {Fit_SelfInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const fit_self = /** @type {((inputs?: Fit_SelfInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Fit_SelfInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.fit_self(inputs)
	return __en.fit_self(inputs)
});
/**
* | output |
* | --- |
* | "For dashboards and tools behind a sign-in." |
*
* @param {Fit_SpaInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const fit_spa = /** @type {((inputs?: Fit_SpaInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Fit_SpaInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.fit_spa(inputs)
	return __en.fit_spa(inputs)
});
/**
* | output |
* | --- |
* | "For prototypes and single-server apps. Nothing to install." |
*
* @param {Fit_SqliteInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const fit_sqlite = /** @type {((inputs?: Fit_SqliteInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Fit_SqliteInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.fit_sqlite(inputs)
	return __en.fit_sqlite(inputs)
});
/**
* | output |
* | --- |
* | "For sites that need SEO or fast first loads." |
*
* @param {Fit_Tanstack_StartInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const fit_tanstack_start = /** @type {((inputs?: Fit_Tanstack_StartInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Fit_Tanstack_StartInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.fit_tanstack_start(inputs)
	return __en.fit_tanstack_start(inputs)
});
/**
* | output |
* | --- |
* | "Production build" |
*
* @param {Gate_BuildInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const gate_build = /** @type {((inputs?: Gate_BuildInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Gate_BuildInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.gate_build(inputs)
	return __en.gate_build(inputs)
});
/**
* | output |
* | --- |
* | "Build the web app" |
*
* @param {Gate_Build_WebInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const gate_build_web = /** @type {((inputs?: Gate_Build_WebInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Gate_Build_WebInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.gate_build_web(inputs)
	return __en.gate_build_web(inputs)
});
/**
* | output |
* | --- |
* | "Types, lint and format" |
*
* @param {Gate_CheckInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const gate_check = /** @type {((inputs?: Gate_CheckInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Gate_CheckInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.gate_check(inputs)
	return __en.gate_check(inputs)
});
/**
* | output |
* | --- |
* | "Check" |
*
* @param {Gate_Check_HereInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const gate_check_here = /** @type {((inputs?: Gate_Check_HereInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Gate_Check_HereInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.gate_check_here(inputs)
	return __en.gate_check_here(inputs)
});
/**
* | output |
* | --- |
* | "Hashing…" |
*
* @param {Gate_CheckingInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const gate_checking = /** @type {((inputs?: Gate_CheckingInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Gate_CheckingInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.gate_checking(inputs)
	return __en.gate_checking(inputs)
});
/**
* | countPlural | output |
* | --- | --- |
* | "one" | "{count} end-to-end browser test" |
* | "other" | "{count} end-to-end browser tests" |
*
* @param {Gate_E2eInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const gate_e2e = /** @type {((inputs: Gate_E2eInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Gate_E2eInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.gate_e2e(inputs)
	return __en.gate_e2e(inputs)
});
/**
* | output |
* | --- |
* | "Fingerprint" |
*
* @param {Gate_FingerprintInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const gate_fingerprint = /** @type {((inputs?: Gate_FingerprintInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Gate_FingerprintInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.gate_fingerprint(inputs)
	return __en.gate_fingerprint(inputs)
});
/**
* | output |
* | --- |
* | "Install dependencies" |
*
* @param {Gate_InstallInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const gate_install = /** @type {((inputs?: Gate_InstallInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Gate_InstallInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.gate_install(inputs)
	return __en.gate_install(inputs)
});
/**
* | output |
* | --- |
* | "No unused code or dependencies" |
*
* @param {Gate_KnipInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const gate_knip = /** @type {((inputs?: Gate_KnipInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Gate_KnipInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.gate_knip(inputs)
	return __en.gate_knip(inputs)
});
/**
* | output |
* | --- |
* | "Matches" |
*
* @param {Gate_MatchInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const gate_match = /** @type {((inputs?: Gate_MatchInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Gate_MatchInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.gate_match(inputs)
	return __en.gate_match(inputs)
});
/**
* | output |
* | --- |
* | "Generate database migrations" |
*
* @param {Gate_MigrateInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const gate_migrate = /** @type {((inputs?: Gate_MigrateInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Gate_MigrateInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.gate_migrate(inputs)
	return __en.gate_migrate(inputs)
});
/**
* | output |
* | --- |
* | "Differs" |
*
* @param {Gate_MismatchInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const gate_mismatch = /** @type {((inputs?: Gate_MismatchInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Gate_MismatchInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.gate_mismatch(inputs)
	return __en.gate_mismatch(inputs)
});
/**
* | output |
* | --- |
* | "Passed {when} in {seconds}s" |
*
* @param {Gate_PassedInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const gate_passed = /** @type {((inputs: Gate_PassedInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Gate_PassedInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.gate_passed(inputs)
	return __en.gate_passed(inputs)
});
/**
* | countPlural | output |
* | --- | --- |
* | "one" | "{count} unit or integration test" |
* | "other" | "{count} unit and integration tests" |
*
* @param {Gate_TestInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const gate_test = /** @type {((inputs: Gate_TestInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Gate_TestInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.gate_test(inputs)
	return __en.gate_test(inputs)
});
/**
* | output |
* | --- |
* | "Generate route types" |
*
* @param {Gate_TypegenInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const gate_typegen = /** @type {((inputs?: Gate_TypegenInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Gate_TypegenInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.gate_typegen(inputs)
	return __en.gate_typegen(inputs)
});
/**
* | output |
* | --- |
* | "Verified" |
*
* @param {Gate_VerifiedInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const gate_verified = /** @type {((inputs?: Gate_VerifiedInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Gate_VerifiedInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.gate_verified(inputs)
	return __en.gate_verified(inputs)
});
/**
* | output |
* | --- |
* | "GitHub" |
*
* @param {GithubInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const github = /** @type {((inputs?: GithubInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<GithubInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.github(inputs)
	return __en.github(inputs)
});
/**
* | output |
* | --- |
* | "Adjusted to fit: {changes}" |
*
* @param {Home_AdjustedInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const home_adjusted = /** @type {((inputs: Home_AdjustedInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_AdjustedInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.home_adjusted(inputs)
	return __en.home_adjusted(inputs)
});
/**
* | output |
* | --- |
* | "Generated projects include type checking, code conventions, and behavioral tests. Developers and AI tools can use the same checks to verify a change." |
*
* @param {Home_Base_BodyInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const home_base_body = /** @type {((inputs?: Home_Base_BodyInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Base_BodyInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.home_base_body(inputs)
	return __en.home_base_body(inputs)
});
/**
* | output |
* | --- |
* | "Changes you can verify." |
*
* @param {Home_Base_TitleInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const home_base_title = /** @type {((inputs?: Home_Base_TitleInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Base_TitleInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.home_base_title(inputs)
	return __en.home_base_title(inputs)
});
/**
* | output |
* | --- |
* | "Pick your stack, run one command, and get a modern full-stack TypeScript project. Built on Vite+, with engineering rules your AI can read. All {stacks} combi..." |
*
* @param {Home_BodyInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const home_body = /** @type {((inputs: Home_BodyInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_BodyInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.home_body(inputs)
	return __en.home_body(inputs)
});
/**
* | output |
* | --- |
* | "Built on" |
*
* @param {Home_Built_OnInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const home_built_on = /** @type {((inputs?: Home_Built_OnInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Built_OnInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.home_built_on(inputs)
	return __en.home_built_on(inputs)
});
/**
* | output |
* | --- |
* | "Pick each layer, let the rest adapt, and start with one command." |
*
* @param {Home_Cta_BodyInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const home_cta_body = /** @type {((inputs?: Home_Cta_BodyInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Cta_BodyInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.home_cta_body(inputs)
	return __en.home_cta_body(inputs)
});
/**
* | output |
* | --- |
* | "Start from the map." |
*
* @param {Home_Cta_TitleInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const home_cta_title = /** @type {((inputs?: Home_Cta_TitleInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Cta_TitleInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.home_cta_title(inputs)
	return __en.home_cta_title(inputs)
});
/**
* | output |
* | --- |
* | "None" |
*
* @param {Home_NoneInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const home_none = /** @type {((inputs?: Home_NoneInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_NoneInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.home_none(inputs)
	return __en.home_none(inputs)
});
/**
* | output |
* | --- |
* | "Open Studio" |
*
* @param {Home_OpenInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const home_open = /** @type {((inputs?: Home_OpenInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_OpenInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.home_open(inputs)
	return __en.home_open(inputs)
});
/**
* | output |
* | --- |
* | "Open in Studio" |
*
* @param {Home_Open_StackInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const home_open_stack = /** @type {((inputs?: Home_Open_StackInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Open_StackInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.home_open_stack(inputs)
	return __en.home_open_stack(inputs)
});
/**
* | output |
* | --- |
* | "stacks" |
*
* @param {Home_Stack_CountInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const home_stack_count = /** @type {((inputs?: Home_Stack_CountInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Stack_CountInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.home_stack_count(inputs)
	return __en.home_stack_count(inputs)
});
/**
* | output |
* | --- |
* | "{layers} layers · {technologies} technologies" |
*
* @param {Home_Stack_MathInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const home_stack_math = /** @type {((inputs: Home_Stack_MathInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Stack_MathInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.home_stack_math(inputs)
	return __en.home_stack_math(inputs)
});
/**
* | output |
* | --- |
* | "AI Native" |
*
* @param {Home_TitleInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const home_title = /** @type {((inputs?: Home_TitleInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & { parts: (inputs?: Home_TitleInputs, options?: { locale?: "en" | "zh" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Home_TitleInputs, { locale?: "en" | "zh" }, { em: { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs?: Home_TitleInputs, options?: { locale?: "en" | "zh" }) => LocalizedString} */ ((inputs = {}, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "zh") return __zh.home_title(inputs)
			return __en.home_title(inputs)
		}),
		{
			parts: /** @type {(inputs?: Home_TitleInputs, options?: { locale?: "en" | "zh" }) => import('../runtime.js').MessagePart[]} */ ((inputs = {}, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "zh") return typeof __zh.home_title.parts === "function" ? __zh.home_title.parts(inputs) : [{ type: "text", value: __zh.home_title(inputs) }]
				return typeof __en.home_title.parts === "function" ? __en.home_title.parts(inputs) : [{ type: "text", value: __en.home_title(inputs) }]
			})
		}
	)
);
/**
* | output |
* | --- |
* | "full-stack scaffolding." |
*
* @param {Home_Title_RestInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const home_title_rest = /** @type {((inputs?: Home_Title_RestInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Title_RestInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.home_title_rest(inputs)
	return __en.home_title_rest(inputs)
});
/**
* | output |
* | --- |
* | "Every stack is installed, checked, tested and built from scratch. The output that passed keeps a fingerprint, so you can check what you get." |
*
* @param {Home_Verify_BodyInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const home_verify_body = /** @type {((inputs?: Home_Verify_BodyInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Verify_BodyInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.home_verify_body(inputs)
	return __en.home_verify_body(inputs)
});
/**
* | output |
* | --- |
* | "Verification for the stack selected above" |
*
* @param {Home_Verify_FollowInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const home_verify_follow = /** @type {((inputs?: Home_Verify_FollowInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Verify_FollowInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.home_verify_follow(inputs)
	return __en.home_verify_follow(inputs)
});
/**
* | output |
* | --- |
* | "A verified starting point." |
*
* @param {Home_Verify_TitleInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const home_verify_title = /** @type {((inputs?: Home_Verify_TitleInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Verify_TitleInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.home_verify_title(inputs)
	return __en.home_verify_title(inputs)
});
/**
* | output |
* | --- |
* | "Hono server" |
*
* @param {Hono_ProcessInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const hono_process = /** @type {((inputs?: Hono_ProcessInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Hono_ProcessInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.hono_process(inputs)
	return __en.hono_process(inputs)
});
/**
* | output |
* | --- |
* | "just now" |
*
* @param {Just_NowInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const just_now = /** @type {((inputs?: Just_NowInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Just_NowInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.just_now(inputs)
	return __en.just_now(inputs)
});
/**
* | output |
* | --- |
* | "API" |
*
* @param {Kind_ApiInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const kind_api = /** @type {((inputs?: Kind_ApiInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kind_ApiInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.kind_api(inputs)
	return __en.kind_api(inputs)
});
/**
* | output |
* | --- |
* | "Auth" |
*
* @param {Kind_AuthInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const kind_auth = /** @type {((inputs?: Kind_AuthInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kind_AuthInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.kind_auth(inputs)
	return __en.kind_auth(inputs)
});
/**
* | output |
* | --- |
* | "Backend" |
*
* @param {Kind_BackendInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const kind_backend = /** @type {((inputs?: Kind_BackendInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kind_BackendInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.kind_backend(inputs)
	return __en.kind_backend(inputs)
});
/**
* | output |
* | --- |
* | "Database" |
*
* @param {Kind_DatabaseInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const kind_database = /** @type {((inputs?: Kind_DatabaseInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kind_DatabaseInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.kind_database(inputs)
	return __en.kind_database(inputs)
});
/**
* | output |
* | --- |
* | "Deployment" |
*
* @param {Kind_DeploymentInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const kind_deployment = /** @type {((inputs?: Kind_DeploymentInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kind_DeploymentInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.kind_deployment(inputs)
	return __en.kind_deployment(inputs)
});
/**
* | output |
* | --- |
* | "Desktop" |
*
* @param {Kind_DesktopInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const kind_desktop = /** @type {((inputs?: Kind_DesktopInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kind_DesktopInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.kind_desktop(inputs)
	return __en.kind_desktop(inputs)
});
/**
* | output |
* | --- |
* | "Framework" |
*
* @param {Kind_FrameworkInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const kind_framework = /** @type {((inputs?: Kind_FrameworkInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kind_FrameworkInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.kind_framework(inputs)
	return __en.kind_framework(inputs)
});
/**
* | output |
* | --- |
* | "Frontend" |
*
* @param {Kind_FrontendInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const kind_frontend = /** @type {((inputs?: Kind_FrontendInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kind_FrontendInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.kind_frontend(inputs)
	return __en.kind_frontend(inputs)
});
/**
* | output |
* | --- |
* | "ORM" |
*
* @param {Kind_OrmInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const kind_orm = /** @type {((inputs?: Kind_OrmInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kind_OrmInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.kind_orm(inputs)
	return __en.kind_orm(inputs)
});
/**
* | output |
* | --- |
* | "Router" |
*
* @param {Kind_RouterInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const kind_router = /** @type {((inputs?: Kind_RouterInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kind_RouterInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.kind_router(inputs)
	return __en.kind_router(inputs)
});
/**
* | output |
* | --- |
* | "Runtime" |
*
* @param {Kind_RuntimeInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const kind_runtime = /** @type {((inputs?: Kind_RuntimeInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kind_RuntimeInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.kind_runtime(inputs)
	return __en.kind_runtime(inputs)
});
/**
* | output |
* | --- |
* | "Testing" |
*
* @param {Kind_TestingInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const kind_testing = /** @type {((inputs?: Kind_TestingInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kind_TestingInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.kind_testing(inputs)
	return __en.kind_testing(inputs)
});
/**
* | output |
* | --- |
* | "Toolchain" |
*
* @param {Kind_ToolchainInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const kind_toolchain = /** @type {((inputs?: Kind_ToolchainInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kind_ToolchainInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.kind_toolchain(inputs)
	return __en.kind_toolchain(inputs)
});
/**
* | output |
* | --- |
* | "UI" |
*
* @param {Kind_UiInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const kind_ui = /** @type {((inputs?: Kind_UiInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kind_UiInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.kind_ui(inputs)
	return __en.kind_ui(inputs)
});
/**
* | output |
* | --- |
* | "Discovers pnpm workspaces, package entries, and tool configuration automatically, with no extra config file. When selected, ready checks for unused code and ..." |
*
* @param {Knip_Scope_DefaultInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const knip_scope_default = /** @type {((inputs?: Knip_Scope_DefaultInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Knip_Scope_DefaultInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.knip_scope_default(inputs)
	return __en.knip_scope_default(inputs)
});
/**
* | output |
* | --- |
* | "knip.json declares Electron main, preload, and both Vite build configurations as entries. Other workspaces are discovered automatically." |
*
* @param {Knip_Scope_DesktopInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const knip_scope_desktop = /** @type {((inputs?: Knip_Scope_DesktopInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Knip_Scope_DesktopInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.knip_scope_desktop(inputs)
	return __en.knip_scope_desktop(inputs)
});
/**
* | output |
* | --- |
* | "Language" |
*
* @param {LanguageInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const language = /** @type {((inputs?: LanguageInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<LanguageInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.language(inputs)
	return __en.language(inputs)
});
/**
* | output |
* | --- |
* | "About {name}" |
*
* @param {Learn_AboutInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const learn_about = /** @type {((inputs: Learn_AboutInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Learn_AboutInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.learn_about(inputs)
	return __en.learn_about(inputs)
});
/**
* | output |
* | --- |
* | "Docs" |
*
* @param {Nav_DocsInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const nav_docs = /** @type {((inputs?: Nav_DocsInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Nav_DocsInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.nav_docs(inputs)
	return __en.nav_docs(inputs)
});
/**
* | output |
* | --- |
* | "Studio" |
*
* @param {Nav_StudioInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const nav_studio = /** @type {((inputs?: Nav_StudioInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Nav_StudioInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.nav_studio(inputs)
	return __en.nav_studio(inputs)
});
/**
* | output |
* | --- |
* | "No API" |
*
* @param {None_ApiInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const none_api = /** @type {((inputs?: None_ApiInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<None_ApiInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.none_api(inputs)
	return __en.none_api(inputs)
});
/**
* | output |
* | --- |
* | "No auth" |
*
* @param {None_AuthInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const none_auth = /** @type {((inputs?: None_AuthInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<None_AuthInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.none_auth(inputs)
	return __en.none_auth(inputs)
});
/**
* | output |
* | --- |
* | "No backend" |
*
* @param {None_BackendInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const none_backend = /** @type {((inputs?: None_BackendInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<None_BackendInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.none_backend(inputs)
	return __en.none_backend(inputs)
});
/**
* | output |
* | --- |
* | "No database" |
*
* @param {None_DatabaseInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const none_database = /** @type {((inputs?: None_DatabaseInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<None_DatabaseInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.none_database(inputs)
	return __en.none_database(inputs)
});
/**
* | output |
* | --- |
* | "No deployment" |
*
* @param {None_DeploymentInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const none_deployment = /** @type {((inputs?: None_DeploymentInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<None_DeploymentInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.none_deployment(inputs)
	return __en.none_deployment(inputs)
});
/**
* | output |
* | --- |
* | "No desktop app" |
*
* @param {None_DesktopInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const none_desktop = /** @type {((inputs?: None_DesktopInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<None_DesktopInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.none_desktop(inputs)
	return __en.none_desktop(inputs)
});
/**
* | output |
* | --- |
* | "No frontend" |
*
* @param {None_FrameworkInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const none_framework = /** @type {((inputs?: None_FrameworkInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<None_FrameworkInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.none_framework(inputs)
	return __en.none_framework(inputs)
});
/**
* | output |
* | --- |
* | "none" |
*
* @param {None_TokenInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const none_token = /** @type {((inputs?: None_TokenInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<None_TokenInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.none_token(inputs)
	return __en.none_token(inputs)
});
/**
* | output |
* | --- |
* | "The address may have moved, or it never existed." |
*
* @param {Not_Found_BodyInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const not_found_body = /** @type {((inputs?: Not_Found_BodyInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Not_Found_BodyInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.not_found_body(inputs)
	return __en.not_found_body(inputs)
});
/**
* | output |
* | --- |
* | "Back to home" |
*
* @param {Not_Found_HomeInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const not_found_home = /** @type {((inputs?: Not_Found_HomeInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Not_Found_HomeInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.not_found_home(inputs)
	return __en.not_found_home(inputs)
});
/**
* | output |
* | --- |
* | "This page isn’t on the map." |
*
* @param {Not_Found_TitleInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const not_found_title = /** @type {((inputs?: Not_Found_TitleInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Not_Found_TitleInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.not_found_title(inputs)
	return __en.not_found_title(inputs)
});
/**
* | output |
* | --- |
* | "Not yet verified at this version" |
*
* @param {Not_VerifiedInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const not_verified = /** @type {((inputs?: Not_VerifiedInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Not_VerifiedInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.not_verified(inputs)
	return __en.not_verified(inputs)
});
/**
* | output |
* | --- |
* | "or point DATABASE_URL at any Postgres" |
*
* @param {Note_Any_PostgresInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const note_any_postgres = /** @type {((inputs?: Note_Any_PostgresInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Note_Any_PostgresInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.note_any_postgres(inputs)
	return __en.note_any_postgres(inputs)
});
/**
* | output |
* | --- |
* | "then set BETTER_AUTH_SECRET: openssl rand -base64 32" |
*
* @param {Note_Auth_SecretInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const note_auth_secret = /** @type {((inputs?: Note_Auth_SecretInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Note_Auth_SecretInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.note_auth_secret(inputs)
	return __en.note_auth_secret(inputs)
});
/**
* | output |
* | --- |
* | "creates {path}" |
*
* @param {Note_Sqlite_FileInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const note_sqlite_file = /** @type {((inputs: Note_Sqlite_FileInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Note_Sqlite_FileInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.note_sqlite_file(inputs)
	return __en.note_sqlite_file(inputs)
});
/**
* | output |
* | --- |
* | "ORM" |
*
* @param {OrmInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const orm = /** @type {((inputs?: OrmInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<OrmInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.orm(inputs)
	return __en.orm(inputs)
});
/**
* | output |
* | --- |
* | "Package manager" |
*
* @param {Package_ManagerInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const package_manager = /** @type {((inputs?: Package_ManagerInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Package_ManagerInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.package_manager(inputs)
	return __en.package_manager(inputs)
});
/**
* | output |
* | --- |
* | "Package manager" |
*
* @param {Package_RunnerInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const package_runner = /** @type {((inputs?: Package_RunnerInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Package_RunnerInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.package_runner(inputs)
	return __en.package_runner(inputs)
});
/**
* | output |
* | --- |
* | "Strict static analysis and consistent formatting surface problems while you code. AGENTS.md documents the project conventions, so developers and AI follow th..." |
*
* @param {Pillar_Quality_BodyInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const pillar_quality_body = /** @type {((inputs?: Pillar_Quality_BodyInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pillar_Quality_BodyInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.pillar_quality_body(inputs)
	return __en.pillar_quality_body(inputs)
});
/**
* | output |
* | --- |
* | "Strict code conventions" |
*
* @param {Pillar_Quality_TitleInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const pillar_quality_title = /** @type {((inputs?: Pillar_Quality_TitleInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pillar_Quality_TitleInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.pillar_quality_title(inputs)
	return __en.pillar_quality_title(inputs)
});
/**
* | output |
* | --- |
* | "Tests target real behavior, not coverage numbers: integration tests use two accounts to verify authorization, and browser tests cover sign-up, sign-in, and d..." |
*
* @param {Pillar_Tests_BodyInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const pillar_tests_body = /** @type {((inputs?: Pillar_Tests_BodyInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pillar_Tests_BodyInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.pillar_tests_body(inputs)
	return __en.pillar_tests_body(inputs)
});
/**
* | output |
* | --- |
* | "Tests that cover real behavior" |
*
* @param {Pillar_Tests_TitleInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const pillar_tests_title = /** @type {((inputs?: Pillar_Tests_TitleInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pillar_Tests_TitleInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.pillar_tests_title(inputs)
	return __en.pillar_tests_title(inputs)
});
/**
* | output |
* | --- |
* | "oRPC carries API types to callers. When a response field changes, type checking identifies code that still uses the old field." |
*
* @param {Pillar_Types_BodyInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const pillar_types_body = /** @type {((inputs?: Pillar_Types_BodyInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pillar_Types_BodyInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.pillar_types_body(inputs)
	return __en.pillar_types_body(inputs)
});
/**
* | output |
* | --- |
* | "End-to-end type safety" |
*
* @param {Pillar_Types_TitleInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const pillar_types_title = /** @type {((inputs?: Pillar_Types_TitleInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pillar_Types_TitleInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.pillar_types_title(inputs)
	return __en.pillar_types_title(inputs)
});
/**
* | output |
* | --- |
* | "PostgreSQL server" |
*
* @param {Postgres_ProcessInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const postgres_process = /** @type {((inputs?: Postgres_ProcessInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Postgres_ProcessInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.postgres_process(inputs)
	return __en.postgres_process(inputs)
});
/**
* | output |
* | --- |
* | "preview" |
*
* @param {PreviewInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const preview = /** @type {((inputs?: PreviewInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<PreviewInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.preview(inputs)
	return __en.preview(inputs)
});
/**
* | output |
* | --- |
* | "Previewing {label}" |
*
* @param {PreviewingInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const previewing = /** @type {((inputs: PreviewingInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & { parts: (inputs: PreviewingInputs, options?: { locale?: "en" | "zh" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<PreviewingInputs, { locale?: "en" | "zh" }, { stack: { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: PreviewingInputs, options?: { locale?: "en" | "zh" }) => LocalizedString} */ ((inputs, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "zh") return __zh.previewing(inputs)
			return __en.previewing(inputs)
		}),
		{
			parts: /** @type {(inputs: PreviewingInputs, options?: { locale?: "en" | "zh" }) => import('../runtime.js').MessagePart[]} */ ((inputs, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "zh") return typeof __zh.previewing.parts === "function" ? __zh.previewing.parts(inputs) : [{ type: "text", value: __zh.previewing(inputs) }]
				return typeof __en.previewing.parts === "function" ? __en.previewing.parts(inputs) : [{ type: "text", value: __en.previewing(inputs) }]
			})
		}
	)
);
/**
* | output |
* | --- |
* | "{name} server" |
*
* @param {ProcessInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const process = /** @type {((inputs: ProcessInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<ProcessInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.process(inputs)
	return __en.process(inputs)
});
/**
* | output |
* | --- |
* | "{name} server for pages and API" |
*
* @param {Process_With_ApiInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const process_with_api = /** @type {((inputs: Process_With_ApiInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Process_With_ApiInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.process_with_api(inputs)
	return __en.process_with_api(inputs)
});
/**
* | output |
* | --- |
* | "Project name" |
*
* @param {Project_NameInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const project_name = /** @type {((inputs?: Project_NameInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Project_NameInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.project_name(inputs)
	return __en.project_name(inputs)
});
/**
* | output |
* | --- |
* | "Project name \"{name}\" must start with a lowercase letter, contain only lowercase letters, digits, and dashes, and be at most {max} characters" |
*
* @param {Project_Name_InvalidInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const project_name_invalid = /** @type {((inputs: Project_Name_InvalidInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Project_Name_InvalidInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.project_name_invalid(inputs)
	return __en.project_name_invalid(inputs)
});
/**
* | output |
* | --- |
* | "Recommended" |
*
* @param {RecommendedInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const recommended = /** @type {((inputs?: RecommendedInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<RecommendedInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.recommended(inputs)
	return __en.recommended(inputs)
});
/**
* | output |
* | --- |
* | "API" |
*
* @param {Role_ApiInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const role_api = /** @type {((inputs?: Role_ApiInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Role_ApiInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.role_api(inputs)
	return __en.role_api(inputs)
});
/**
* | output |
* | --- |
* | "How the frontend calls the backend." |
*
* @param {Role_Api_AboutInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const role_api_about = /** @type {((inputs?: Role_Api_AboutInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Role_Api_AboutInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.role_api_about(inputs)
	return __en.role_api_about(inputs)
});
/**
* | output |
* | --- |
* | "Only a health check. Routes are yours to write." |
*
* @param {Role_Api_NoneInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const role_api_none = /** @type {((inputs?: Role_Api_NoneInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Role_Api_NoneInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.role_api_none(inputs)
	return __en.role_api_none(inputs)
});
/**
* | output |
* | --- |
* | "How does the frontend talk to the backend?" |
*
* @param {Role_Api_QuestionInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const role_api_question = /** @type {((inputs?: Role_Api_QuestionInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Role_Api_QuestionInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.role_api_question(inputs)
	return __en.role_api_question(inputs)
});
/**
* | output |
* | --- |
* | "Auth" |
*
* @param {Role_AuthInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const role_auth = /** @type {((inputs?: Role_AuthInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Role_AuthInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.role_auth(inputs)
	return __en.role_auth(inputs)
});
/**
* | output |
* | --- |
* | "Sign-up, sign-in, and sessions." |
*
* @param {Role_Auth_AboutInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const role_auth_about = /** @type {((inputs?: Role_Auth_AboutInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Role_Auth_AboutInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.role_auth_about(inputs)
	return __en.role_auth_about(inputs)
});
/**
* | output |
* | --- |
* | "No sign-in. Every visitor sees the same app." |
*
* @param {Role_Auth_NoneInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const role_auth_none = /** @type {((inputs?: Role_Auth_NoneInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Role_Auth_NoneInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.role_auth_none(inputs)
	return __en.role_auth_none(inputs)
});
/**
* | output |
* | --- |
* | "Do users sign in?" |
*
* @param {Role_Auth_QuestionInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const role_auth_question = /** @type {((inputs?: Role_Auth_QuestionInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Role_Auth_QuestionInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.role_auth_question(inputs)
	return __en.role_auth_question(inputs)
});
/**
* | output |
* | --- |
* | "Backend" |
*
* @param {Role_BackendInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const role_backend = /** @type {((inputs?: Role_BackendInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Role_BackendInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.role_backend(inputs)
	return __en.role_backend(inputs)
});
/**
* | output |
* | --- |
* | "Server code that handles requests, data, and secrets." |
*
* @param {Role_Backend_AboutInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const role_backend_about = /** @type {((inputs?: Role_Backend_AboutInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Role_Backend_AboutInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.role_backend_about(inputs)
	return __en.role_backend_about(inputs)
});
/**
* | output |
* | --- |
* | "No server code. The frontend ships as static files." |
*
* @param {Role_Backend_NoneInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const role_backend_none = /** @type {((inputs?: Role_Backend_NoneInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Role_Backend_NoneInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.role_backend_none(inputs)
	return __en.role_backend_none(inputs)
});
/**
* | output |
* | --- |
* | "Where does server code run?" |
*
* @param {Role_Backend_QuestionInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const role_backend_question = /** @type {((inputs?: Role_Backend_QuestionInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Role_Backend_QuestionInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.role_backend_question(inputs)
	return __en.role_backend_question(inputs)
});
/**
* | output |
* | --- |
* | "Database" |
*
* @param {Role_DatabaseInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const role_database = /** @type {((inputs?: Role_DatabaseInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Role_DatabaseInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.role_database(inputs)
	return __en.role_database(inputs)
});
/**
* | output |
* | --- |
* | "Keeps data such as users and orders." |
*
* @param {Role_Database_AboutInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const role_database_about = /** @type {((inputs?: Role_Database_AboutInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Role_Database_AboutInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.role_database_about(inputs)
	return __en.role_database_about(inputs)
});
/**
* | output |
* | --- |
* | "Nothing is stored between requests." |
*
* @param {Role_Database_NoneInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const role_database_none = /** @type {((inputs?: Role_Database_NoneInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Role_Database_NoneInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.role_database_none(inputs)
	return __en.role_database_none(inputs)
});
/**
* | output |
* | --- |
* | "Where is data stored?" |
*
* @param {Role_Database_QuestionInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const role_database_question = /** @type {((inputs?: Role_Database_QuestionInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Role_Database_QuestionInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.role_database_question(inputs)
	return __en.role_database_question(inputs)
});
/**
* | output |
* | --- |
* | "Deployment" |
*
* @param {Role_DeploymentInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const role_deployment = /** @type {((inputs?: Role_DeploymentInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Role_DeploymentInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.role_deployment(inputs)
	return __en.role_deployment(inputs)
});
/**
* | output |
* | --- |
* | "How the app is packaged for a server." |
*
* @param {Role_Deployment_AboutInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const role_deployment_about = /** @type {((inputs?: Role_Deployment_AboutInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Role_Deployment_AboutInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.role_deployment_about(inputs)
	return __en.role_deployment_about(inputs)
});
/**
* | output |
* | --- |
* | "No image. Runs anywhere Node.js runs." |
*
* @param {Role_Deployment_NoneInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const role_deployment_none = /** @type {((inputs?: Role_Deployment_NoneInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Role_Deployment_NoneInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.role_deployment_none(inputs)
	return __en.role_deployment_none(inputs)
});
/**
* | output |
* | --- |
* | "How does it ship?" |
*
* @param {Role_Deployment_QuestionInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const role_deployment_question = /** @type {((inputs?: Role_Deployment_QuestionInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Role_Deployment_QuestionInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.role_deployment_question(inputs)
	return __en.role_deployment_question(inputs)
});
/**
* | output |
* | --- |
* | "Desktop" |
*
* @param {Role_DesktopInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const role_desktop = /** @type {((inputs?: Role_DesktopInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Role_DesktopInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.role_desktop(inputs)
	return __en.role_desktop(inputs)
});
/**
* | output |
* | --- |
* | "The web app in its own window, packaged as an installer." |
*
* @param {Role_Desktop_AboutInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const role_desktop_about = /** @type {((inputs?: Role_Desktop_AboutInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Role_Desktop_AboutInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.role_desktop_about(inputs)
	return __en.role_desktop_about(inputs)
});
/**
* | output |
* | --- |
* | "No installer. The app runs in the browser." |
*
* @param {Role_Desktop_NoneInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const role_desktop_none = /** @type {((inputs?: Role_Desktop_NoneInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Role_Desktop_NoneInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.role_desktop_none(inputs)
	return __en.role_desktop_none(inputs)
});
/**
* | output |
* | --- |
* | "Does it need a desktop app?" |
*
* @param {Role_Desktop_QuestionInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const role_desktop_question = /** @type {((inputs?: Role_Desktop_QuestionInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Role_Desktop_QuestionInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.role_desktop_question(inputs)
	return __en.role_desktop_question(inputs)
});
/**
* | output |
* | --- |
* | "Frontend" |
*
* @param {Role_FrameworkInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const role_framework = /** @type {((inputs?: Role_FrameworkInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Role_FrameworkInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.role_framework(inputs)
	return __en.role_framework(inputs)
});
/**
* | output |
* | --- |
* | "The pages users open in a browser." |
*
* @param {Role_Framework_AboutInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const role_framework_about = /** @type {((inputs?: Role_Framework_AboutInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Role_Framework_AboutInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.role_framework_about(inputs)
	return __en.role_framework_about(inputs)
});
/**
* | output |
* | --- |
* | "No pages. Only an API for other apps to call." |
*
* @param {Role_Framework_NoneInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const role_framework_none = /** @type {((inputs?: Role_Framework_NoneInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Role_Framework_NoneInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.role_framework_none(inputs)
	return __en.role_framework_none(inputs)
});
/**
* | output |
* | --- |
* | "How are the pages built?" |
*
* @param {Role_Framework_QuestionInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const role_framework_question = /** @type {((inputs?: Role_Framework_QuestionInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Role_Framework_QuestionInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.role_framework_question(inputs)
	return __en.role_framework_question(inputs)
});
/**
* | output |
* | --- |
* | "Runs in the browser" |
*
* @param {Runs_In_BrowserInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const runs_in_browser = /** @type {((inputs?: Runs_In_BrowserInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Runs_In_BrowserInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.runs_in_browser(inputs)
	return __en.runs_in_browser(inputs)
});
/**
* | output |
* | --- |
* | "Renderer in an Electron window" |
*
* @param {Runs_In_ElectronInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const runs_in_electron = /** @type {((inputs?: Runs_In_ElectronInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Runs_In_ElectronInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.runs_in_electron(inputs)
	return __en.runs_in_electron(inputs)
});
/**
* | output |
* | --- |
* | "Runs the Hono server. The package manager, web framework and test tools are independent." |
*
* @param {Runtime_AboutInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const runtime_about = /** @type {((inputs?: Runtime_AboutInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Runtime_AboutInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.runtime_about(inputs)
	return __en.runtime_about(inputs)
});
/**
* | output |
* | --- |
* | "No application runtime" |
*
* @param {Runtime_NoneInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const runtime_none = /** @type {((inputs?: Runtime_NoneInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Runtime_NoneInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.runtime_none(inputs)
	return __en.runtime_none(inputs)
});
/**
* | output |
* | --- |
* | "Run Hono on which runtime?" |
*
* @param {Runtime_QuestionInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const runtime_question = /** @type {((inputs?: Runtime_QuestionInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Runtime_QuestionInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.runtime_question(inputs)
	return __en.runtime_question(inputs)
});
/**
* | output |
* | --- |
* | "Search docs" |
*
* @param {Search_DocsInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const search_docs = /** @type {((inputs?: Search_DocsInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Search_DocsInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.search_docs(inputs)
	return __en.search_docs(inputs)
});
/**
* | output |
* | --- |
* | "Nothing matches “{query}”" |
*
* @param {Search_EmptyInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const search_empty = /** @type {((inputs: Search_EmptyInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Search_EmptyInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.search_empty(inputs)
	return __en.search_empty(inputs)
});
/**
* | output |
* | --- |
* | "to move" |
*
* @param {Search_Hint_MoveInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const search_hint_move = /** @type {((inputs?: Search_Hint_MoveInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Search_Hint_MoveInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.search_hint_move(inputs)
	return __en.search_hint_move(inputs)
});
/**
* | output |
* | --- |
* | "to open" |
*
* @param {Search_Hint_OpenInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const search_hint_open = /** @type {((inputs?: Search_Hint_OpenInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Search_Hint_OpenInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.search_hint_open(inputs)
	return __en.search_hint_open(inputs)
});
/**
* | output |
* | --- |
* | "Search pages, concepts, commands…" |
*
* @param {Search_PlaceholderInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const search_placeholder = /** @type {((inputs?: Search_PlaceholderInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Search_PlaceholderInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.search_placeholder(inputs)
	return __en.search_placeholder(inputs)
});
/**
* | output |
* | --- |
* | "Search docs" |
*
* @param {Search_Placeholder_ShortInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const search_placeholder_short = /** @type {((inputs?: Search_Placeholder_ShortInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Search_Placeholder_ShortInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.search_placeholder_short(inputs)
	return __en.search_placeholder_short(inputs)
});
/**
* | output |
* | --- |
* | "Searching…" |
*
* @param {Search_SearchingInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const search_searching = /** @type {((inputs?: Search_SearchingInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Search_SearchingInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.search_searching(inputs)
	return __en.search_searching(inputs)
});
/**
* | output |
* | --- |
* | "Your stack" |
*
* @param {Studio_StackInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const studio_stack = /** @type {((inputs?: Studio_StackInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Studio_StackInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.studio_stack(inputs)
	return __en.studio_stack(inputs)
});
/**
* | output |
* | --- |
* | "Vitest runs unit tests. An API-only project has no browser end-to-end tests." |
*
* @param {Tests_Scope_ApiInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const tests_scope_api = /** @type {((inputs?: Tests_Scope_ApiInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tests_Scope_ApiInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.tests_scope_api(inputs)
	return __en.tests_scope_api(inputs)
});
/**
* | output |
* | --- |
* | "Vitest runs unit tests and API integration tests against a real database. An API-only project has no browser end-to-end tests." |
*
* @param {Tests_Scope_Api_IntegrationInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const tests_scope_api_integration = /** @type {((inputs?: Tests_Scope_Api_IntegrationInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tests_Scope_Api_IntegrationInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.tests_scope_api_integration(inputs)
	return __en.tests_scope_api_integration(inputs)
});
/**
* | output |
* | --- |
* | "Vitest runs unit tests; Playwright verifies pages and browser interactions." |
*
* @param {Tests_Scope_StaticInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const tests_scope_static = /** @type {((inputs?: Tests_Scope_StaticInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tests_Scope_StaticInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.tests_scope_static(inputs)
	return __en.tests_scope_static(inputs)
});
/**
* | output |
* | --- |
* | "Vitest runs unit tests; Playwright verifies complete user journeys in a real browser." |
*
* @param {Tests_Scope_WebInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const tests_scope_web = /** @type {((inputs?: Tests_Scope_WebInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tests_Scope_WebInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.tests_scope_web(inputs)
	return __en.tests_scope_web(inputs)
});
/**
* | output |
* | --- |
* | "Vitest runs unit tests and API integration tests against a real database; Playwright verifies complete user journeys in a real browser." |
*
* @param {Tests_Scope_Web_IntegrationInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const tests_scope_web_integration = /** @type {((inputs?: Tests_Scope_Web_IntegrationInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tests_Scope_Web_IntegrationInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.tests_scope_web_integration(inputs)
	return __en.tests_scope_web_integration(inputs)
});
/**
* | output |
* | --- |
* | "Unused code" |
*
* @param {Tool_AnalyzeInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const tool_analyze = /** @type {((inputs?: Tool_AnalyzeInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tool_AnalyzeInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.tool_analyze(inputs)
	return __en.tool_analyze(inputs)
});
/**
* | output |
* | --- |
* | "Build" |
*
* @param {Tool_BuildInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const tool_build = /** @type {((inputs?: Tool_BuildInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tool_BuildInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.tool_build(inputs)
	return __en.tool_build(inputs)
});
/**
* | output |
* | --- |
* | "Built-in" |
*
* @param {Tool_BuiltinInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const tool_builtin = /** @type {((inputs?: Tool_BuiltinInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tool_BuiltinInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.tool_builtin(inputs)
	return __en.tool_builtin(inputs)
});
/**
* | output |
* | --- |
* | "Check code" |
*
* @param {Tool_CheckInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const tool_check = /** @type {((inputs?: Tool_CheckInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tool_CheckInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.tool_check(inputs)
	return __en.tool_check(inputs)
});
/**
* | output |
* | --- |
* | "Develop" |
*
* @param {Tool_DevInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const tool_dev = /** @type {((inputs?: Tool_DevInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tool_DevInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.tool_dev(inputs)
	return __en.tool_dev(inputs)
});
/**
* | output |
* | --- |
* | "End to end" |
*
* @param {Tool_E2eInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const tool_e2e = /** @type {((inputs?: Tool_E2eInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tool_E2eInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.tool_e2e(inputs)
	return __en.tool_e2e(inputs)
});
/**
* | output |
* | --- |
* | "Unit tests" |
*
* @param {Tool_TestInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const tool_test = /** @type {((inputs?: Tool_TestInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tool_TestInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.tool_test(inputs)
	return __en.tool_test(inputs)
});
/**
* | output |
* | --- |
* | "Unit / integration" |
*
* @param {Tool_Test_IntegrationInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const tool_test_integration = /** @type {((inputs?: Tool_Test_IntegrationInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tool_Test_IntegrationInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.tool_test_integration(inputs)
	return __en.tool_test_integration(inputs)
});
/**
* | output |
* | --- |
* | "Development, production builds, formatting, linting, and type checks share one configuration and command set." |
*
* @param {Toolchain_ScopeInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const toolchain_scope = /** @type {((inputs?: Toolchain_ScopeInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toolchain_ScopeInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.toolchain_scope(inputs)
	return __en.toolchain_scope(inputs)
});
/**
* | output |
* | --- |
* | "Adds Ultracite lint and formatting presets to vp check, with framework rules for the selected stack. Opting out keeps Vite+ baseline checks, type checking, a..." |
*
* @param {Ultracite_ScopeInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const ultracite_scope = /** @type {((inputs?: Ultracite_ScopeInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ultracite_ScopeInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.ultracite_scope(inputs)
	return __en.ultracite_scope(inputs)
});
/**
* | output |
* | --- |
* | "Verified {when}" |
*
* @param {VerifiedInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const verified = /** @type {((inputs: VerifiedInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<VerifiedInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.verified(inputs)
	return __en.verified(inputs)
});
/**
* | output |
* | --- |
* | "vp run ready passed on this exact output" |
*
* @param {Verified_PassedInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const verified_passed = /** @type {((inputs?: Verified_PassedInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & { parts: (inputs?: Verified_PassedInputs, options?: { locale?: "en" | "zh" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Verified_PassedInputs, { locale?: "en" | "zh" }, { code: { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs?: Verified_PassedInputs, options?: { locale?: "en" | "zh" }) => LocalizedString} */ ((inputs = {}, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "zh") return __zh.verified_passed(inputs)
			return __en.verified_passed(inputs)
		}),
		{
			parts: /** @type {(inputs?: Verified_PassedInputs, options?: { locale?: "en" | "zh" }) => import('../runtime.js').MessagePart[]} */ ((inputs = {}, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "zh") return typeof __zh.verified_passed.parts === "function" ? __zh.verified_passed.parts(inputs) : [{ type: "text", value: __zh.verified_passed(inputs) }]
				return typeof __en.verified_passed.parts === "function" ? __en.verified_passed.parts(inputs) : [{ type: "text", value: __en.verified_passed(inputs) }]
			})
		}
	)
);
/**
* | output |
* | --- |
* | "Visit the {name} website" |
*
* @param {Visit_SiteInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const visit_site = /** @type {((inputs: Visit_SiteInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Visit_SiteInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.visit_site(inputs)
	return __en.visit_site(inputs)
});
/**
* | output |
* | --- |
* | "Users" |
*
* @param {VisitorsInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const visitors = /** @type {((inputs?: VisitorsInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<VisitorsInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.visitors(inputs)
	return __en.visitors(inputs)
});
/**
* | output |
* | --- |
* | "vp run ready: every check passed" |
*
* @param {Viz_All_PassedInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const viz_all_passed = /** @type {((inputs?: Viz_All_PassedInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Viz_All_PassedInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.viz_all_passed(inputs)
	return __en.viz_all_passed(inputs)
});
/**
* | output |
* | --- |
* | "Caught by {gate} before it shipped" |
*
* @param {Viz_Caught_ByInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const viz_caught_by = /** @type {((inputs: Viz_Caught_ByInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Viz_Caught_ByInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.viz_caught_by(inputs)
	return __en.viz_caught_by(inputs)
});
/**
* | output |
* | --- |
* | "Code" |
*
* @param {Viz_Docker_CodeInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const viz_docker_code = /** @type {((inputs?: Viz_Docker_CodeInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Viz_Docker_CodeInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.viz_docker_code(inputs)
	return __en.viz_docker_code(inputs)
});
/**
* | output |
* | --- |
* | "Containers" |
*
* @param {Viz_Docker_ContainersInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const viz_docker_containers = /** @type {((inputs?: Viz_Docker_ContainersInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Viz_Docker_ContainersInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.viz_docker_containers(inputs)
	return __en.viz_docker_containers(inputs)
});
/**
* | output |
* | --- |
* | "Image" |
*
* @param {Viz_Docker_ImageInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const viz_docker_image = /** @type {((inputs?: Viz_Docker_ImageInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Viz_Docker_ImageInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.viz_docker_image(inputs)
	return __en.viz_docker_image(inputs)
});
/**
* | output |
* | --- |
* | "Nothing running yet" |
*
* @param {Viz_Docker_NoneInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const viz_docker_none = /** @type {((inputs?: Viz_Docker_NoneInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Viz_Docker_NoneInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.viz_docker_none(inputs)
	return __en.viz_docker_none(inputs)
});
/**
* | output |
* | --- |
* | "Let the AI fix it" |
*
* @param {Viz_Fix_RerunInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const viz_fix_rerun = /** @type {((inputs?: Viz_Fix_RerunInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Viz_Fix_RerunInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.viz_fix_rerun(inputs)
	return __en.viz_fix_rerun(inputs)
});
/**
* | output |
* | --- |
* | "End-to-end" |
*
* @param {Viz_Gate_E2eInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const viz_gate_e2e = /** @type {((inputs?: Viz_Gate_E2eInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Viz_Gate_E2eInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.viz_gate_e2e(inputs)
	return __en.viz_gate_e2e(inputs)
});
/**
* | output |
* | --- |
* | "Integration tests" |
*
* @param {Viz_Gate_IntegrationInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const viz_gate_integration = /** @type {((inputs?: Viz_Gate_IntegrationInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Viz_Gate_IntegrationInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.viz_gate_integration(inputs)
	return __en.viz_gate_integration(inputs)
});
/**
* | output |
* | --- |
* | "Lint" |
*
* @param {Viz_Gate_LintInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const viz_gate_lint = /** @type {((inputs?: Viz_Gate_LintInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Viz_Gate_LintInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.viz_gate_lint(inputs)
	return __en.viz_gate_lint(inputs)
});
/**
* | output |
* | --- |
* | "Types" |
*
* @param {Viz_Gate_TypesInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const viz_gate_types = /** @type {((inputs?: Viz_Gate_TypesInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Viz_Gate_TypesInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.viz_gate_types(inputs)
	return __en.viz_gate_types(inputs)
});
/**
* | output |
* | --- |
* | "Foundation" |
*
* @param {Viz_Group_FoundationInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const viz_group_foundation = /** @type {((inputs?: Viz_Group_FoundationInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Viz_Group_FoundationInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.viz_group_foundation(inputs)
	return __en.viz_group_foundation(inputs)
});
/**
* | output |
* | --- |
* | "Yours, kept" |
*
* @param {Viz_How_KeptInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const viz_how_kept = /** @type {((inputs?: Viz_How_KeptInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Viz_How_KeptInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.viz_how_kept(inputs)
	return __en.viz_how_kept(inputs)
});
/**
* | output |
* | --- |
* | "Template update merged" |
*
* @param {Viz_How_MergedInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const viz_how_merged = /** @type {((inputs?: Viz_How_MergedInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Viz_How_MergedInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.viz_how_merged(inputs)
	return __en.viz_how_merged(inputs)
});
/**
* | output |
* | --- |
* | "Left open, without prompts" |
*
* @param {Viz_Kind_DefaultInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const viz_kind_default = /** @type {((inputs?: Viz_Kind_DefaultInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Viz_Kind_DefaultInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.viz_kind_default(inputs)
	return __en.viz_kind_default(inputs)
});
/**
* | output |
* | --- |
* | "Flag" |
*
* @param {Viz_Kind_FlagInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const viz_kind_flag = /** @type {((inputs?: Viz_Kind_FlagInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Viz_Kind_FlagInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.viz_kind_flag(inputs)
	return __en.viz_kind_flag(inputs)
});
/**
* | output |
* | --- |
* | "Follows the other choices" |
*
* @param {Viz_Kind_FollowsInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const viz_kind_follows = /** @type {((inputs?: Viz_Kind_FollowsInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Viz_Kind_FollowsInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.viz_kind_follows(inputs)
	return __en.viz_kind_follows(inputs)
});
/**
* | output |
* | --- |
* | "Values" |
*
* @param {Viz_Kind_OptionsInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const viz_kind_options = /** @type {((inputs?: Viz_Kind_OptionsInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Viz_Kind_OptionsInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.viz_kind_options(inputs)
	return __en.viz_kind_options(inputs)
});
/**
* | output |
* | --- |
* | "Your built app" |
*
* @param {Viz_Layer_AppInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const viz_layer_app = /** @type {((inputs?: Viz_Layer_AppInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Viz_Layer_AppInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.viz_layer_app(inputs)
	return __en.viz_layer_app(inputs)
});
/**
* | output |
* | --- |
* | "Runtime" |
*
* @param {Viz_Layer_RuntimeInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const viz_layer_runtime = /** @type {((inputs?: Viz_Layer_RuntimeInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Viz_Layer_RuntimeInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.viz_layer_runtime(inputs)
	return __en.viz_layer_runtime(inputs)
});
/**
* | output |
* | --- |
* | "Start command" |
*
* @param {Viz_Layer_StartInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const viz_layer_start = /** @type {((inputs?: Viz_Layer_StartInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Viz_Layer_StartInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.viz_layer_start(inputs)
	return __en.viz_layer_start(inputs)
});
/**
* | output |
* | --- |
* | "Operating system" |
*
* @param {Viz_Layer_SystemInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const viz_layer_system = /** @type {((inputs?: Viz_Layer_SystemInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Viz_Layer_SystemInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.viz_layer_system(inputs)
	return __en.viz_layer_system(inputs)
});
/**
* | output |
* | --- |
* | "Next" |
*
* @param {Viz_NextInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const viz_next = /** @type {((inputs?: Viz_NextInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Viz_NextInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.viz_next(inputs)
	return __en.viz_next(inputs)
});
/**
* | output |
* | --- |
* | "Browser · frontend" |
*
* @param {Viz_Node_BrowserInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const viz_node_browser = /** @type {((inputs?: Viz_Node_BrowserInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Viz_Node_BrowserInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.viz_node_browser(inputs)
	return __en.viz_node_browser(inputs)
});
/**
* | output |
* | --- |
* | "Database" |
*
* @param {Viz_Node_DatabaseInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const viz_node_database = /** @type {((inputs?: Viz_Node_DatabaseInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Viz_Node_DatabaseInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.viz_node_database(inputs)
	return __en.viz_node_database(inputs)
});
/**
* | output |
* | --- |
* | "Server · backend" |
*
* @param {Viz_Node_ServerInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const viz_node_server = /** @type {((inputs?: Viz_Node_ServerInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Viz_Node_ServerInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.viz_node_server(inputs)
	return __en.viz_node_server(inputs)
});
/**
* | output |
* | --- |
* | "You" |
*
* @param {Viz_Node_UserInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const viz_node_user = /** @type {((inputs?: Viz_Node_UserInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Viz_Node_UserInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.viz_node_user(inputs)
	return __en.viz_node_user(inputs)
});
/**
* | output |
* | --- |
* | "Ready" |
*
* @param {Viz_Phase_DoneInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const viz_phase_done = /** @type {((inputs?: Viz_Phase_DoneInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Viz_Phase_DoneInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.viz_phase_done(inputs)
	return __en.viz_phase_done(inputs)
});
/**
* | output |
* | --- |
* | "Downloading JavaScript…" |
*
* @param {Viz_Phase_DownloadInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const viz_phase_download = /** @type {((inputs?: Viz_Phase_DownloadInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Viz_Phase_DownloadInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.viz_phase_download(inputs)
	return __en.viz_phase_download(inputs)
});
/**
* | output |
* | --- |
* | "Asking the server for data…" |
*
* @param {Viz_Phase_FetchInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const viz_phase_fetch = /** @type {((inputs?: Viz_Phase_FetchInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Viz_Phase_FetchInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.viz_phase_fetch(inputs)
	return __en.viz_phase_fetch(inputs)
});
/**
* | output |
* | --- |
* | "Hydrating: enabling interaction…" |
*
* @param {Viz_Phase_HydrateInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const viz_phase_hydrate = /** @type {((inputs?: Viz_Phase_HydrateInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Viz_Phase_HydrateInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.viz_phase_hydrate(inputs)
	return __en.viz_phase_hydrate(inputs)
});
/**
* | output |
* | --- |
* | "The server builds the page…" |
*
* @param {Viz_Phase_ServerInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const viz_phase_server = /** @type {((inputs?: Viz_Phase_ServerInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Viz_Phase_ServerInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.viz_phase_server(inputs)
	return __en.viz_phase_server(inputs)
});
/**
* | output |
* | --- |
* | "Plant a bug" |
*
* @param {Viz_Plant_BugInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const viz_plant_bug = /** @type {((inputs?: Viz_Plant_BugInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Viz_Plant_BugInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.viz_plant_bug(inputs)
	return __en.viz_plant_bug(inputs)
});
/**
* | output |
* | --- |
* | "Previous step" |
*
* @param {Viz_PrevInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const viz_prev = /** @type {((inputs?: Viz_PrevInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Viz_PrevInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.viz_prev(inputs)
	return __en.viz_prev(inputs)
});
/**
* | output |
* | --- |
* | "Load again" |
*
* @param {Viz_ReloadInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const viz_reload = /** @type {((inputs?: Viz_ReloadInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Viz_ReloadInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.viz_reload(inputs)
	return __en.viz_reload(inputs)
});
/**
* | output |
* | --- |
* | "Client and server rendering load content and enable interaction at different stages." |
*
* @param {Viz_Render_CaptionInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const viz_render_caption = /** @type {((inputs?: Viz_Render_CaptionInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Viz_Render_CaptionInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.viz_render_caption(inputs)
	return __en.viz_render_caption(inputs)
});
/**
* | output |
* | --- |
* | "Rendered in the browser" |
*
* @param {Viz_Render_SpaInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const viz_render_spa = /** @type {((inputs?: Viz_Render_SpaInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Viz_Render_SpaInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.viz_render_spa(inputs)
	return __en.viz_render_spa(inputs)
});
/**
* | output |
* | --- |
* | "Rendered on the server" |
*
* @param {Viz_Render_SsrInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const viz_render_ssr = /** @type {((inputs?: Viz_Render_SsrInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Viz_Render_SsrInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.viz_render_ssr(inputs)
	return __en.viz_render_ssr(inputs)
});
/**
* | output |
* | --- |
* | "Sequence and timing are illustrative; actual behavior depends on the application and environment." |
*
* @param {Viz_Render_StatusInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const viz_render_status = /** @type {((inputs?: Viz_Render_StatusInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Viz_Render_StatusInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.viz_render_status(inputs)
	return __en.viz_render_status(inputs)
});
/**
* | output |
* | --- |
* | "Replay" |
*
* @param {Viz_ReplayInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const viz_replay = /** @type {((inputs?: Viz_ReplayInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Viz_ReplayInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.viz_replay(inputs)
	return __en.viz_replay(inputs)
});
/**
* | output |
* | --- |
* | "Restore" |
*
* @param {Viz_RestoreInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const viz_restore = /** @type {((inputs?: Viz_RestoreInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Viz_RestoreInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.viz_restore(inputs)
	return __en.viz_restore(inputs)
});
/**
* | output |
* | --- |
* | "Content visible" |
*
* @param {Viz_SeenInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const viz_seen = /** @type {((inputs?: Viz_SeenInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Viz_SeenInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.viz_seen(inputs)
	return __en.viz_seen(inputs)
});
/**
* | output |
* | --- |
* | "{current} / {total}" |
*
* @param {Viz_StepInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const viz_step = /** @type {((inputs: Viz_StepInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Viz_StepInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.viz_step(inputs)
	return __en.viz_step(inputs)
});
/**
* | output |
* | --- |
* | "{count} tests" |
*
* @param {Viz_Test_CountInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const viz_test_count = /** @type {((inputs: Viz_Test_CountInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Viz_Test_CountInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.viz_test_count(inputs)
	return __en.viz_test_count(inputs)
});
/**
* | output |
* | --- |
* | "End-to-end" |
*
* @param {Viz_Test_E2eInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const viz_test_e2e = /** @type {((inputs?: Viz_Test_E2eInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Viz_Test_E2eInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.viz_test_e2e(inputs)
	return __en.viz_test_e2e(inputs)
});
/**
* | output |
* | --- |
* | "Integration" |
*
* @param {Viz_Test_IntegrationInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const viz_test_integration = /** @type {((inputs?: Viz_Test_IntegrationInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Viz_Test_IntegrationInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.viz_test_integration(inputs)
	return __en.viz_test_integration(inputs)
});
/**
* | output |
* | --- |
* | "Unit" |
*
* @param {Viz_Test_UnitInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const viz_test_unit = /** @type {((inputs?: Viz_Test_UnitInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Viz_Test_UnitInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.viz_test_unit(inputs)
	return __en.viz_test_unit(inputs)
});
/**
* | output |
* | --- |
* | "Two test suites for the same todo app. Plant a real bug, a list that shows every user's todos, and run both." |
*
* @param {Viz_Tests_CaptionInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const viz_tests_caption = /** @type {((inputs?: Viz_Tests_CaptionInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Viz_Tests_CaptionInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.viz_tests_caption(inputs)
	return __en.viz_tests_caption(inputs)
});
/**
* | output |
* | --- |
* | "Thirty-six tests stay green while every user can read everyone's todos. Two of seven fail and point to the leak." |
*
* @param {Viz_Tests_Caption_BrokenInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const viz_tests_caption_broken = /** @type {((inputs?: Viz_Tests_Caption_BrokenInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Viz_Tests_Caption_BrokenInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.viz_tests_caption_broken(inputs)
	return __en.viz_tests_caption_broken(inputs)
});
/**
* | output |
* | --- |
* | "vibestart suite: {count} tests fail and point to the leak" |
*
* @param {Viz_Tests_CaughtInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const viz_tests_caught = /** @type {((inputs: Viz_Tests_CaughtInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Viz_Tests_CaughtInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.viz_tests_caught(inputs)
	return __en.viz_tests_caught(inputs)
});
/**
* | output |
* | --- |
* | "Both suites pass" |
*
* @param {Viz_Tests_GreenInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const viz_tests_green = /** @type {((inputs?: Viz_Tests_GreenInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Viz_Tests_GreenInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.viz_tests_green(inputs)
	return __en.viz_tests_green(inputs)
});
/**
* | output |
* | --- |
* | "+ {count} more like these" |
*
* @param {Viz_Tests_MoreInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const viz_tests_more = /** @type {((inputs: Viz_Tests_MoreInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Viz_Tests_MoreInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.viz_tests_more(inputs)
	return __en.viz_tests_more(inputs)
});
/**
* | output |
* | --- |
* | "What a generated project ships" |
*
* @param {Viz_Tests_OursInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const viz_tests_ours = /** @type {((inputs?: Viz_Tests_OursInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Viz_Tests_OursInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.viz_tests_ours(inputs)
	return __en.viz_tests_ours(inputs)
});
/**
* | output |
* | --- |
* | "Typical suite: all green, and the leak ships" |
*
* @param {Viz_Tests_ShippedInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const viz_tests_shipped = /** @type {((inputs?: Viz_Tests_ShippedInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Viz_Tests_ShippedInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.viz_tests_shipped(inputs)
	return __en.viz_tests_shipped(inputs)
});
/**
* | output |
* | --- |
* | "What an AI writes when asked for tests" |
*
* @param {Viz_Tests_TypicalInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const viz_tests_typical = /** @type {((inputs?: Viz_Tests_TypicalInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Viz_Tests_TypicalInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.viz_tests_typical(inputs)
	return __en.viz_tests_typical(inputs)
});
/**
* | output |
* | --- |
* | "Answers clicks" |
*
* @param {Viz_UsableInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const viz_usable = /** @type {((inputs?: Viz_UsableInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Viz_UsableInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.viz_usable(inputs)
	return __en.viz_usable(inputs)
});
/**
* | countPlural | output |
* | --- | --- |
* | "one" | "{names} needs {capabilities}." |
* | "other" | "{names} need {capabilities}." |
*
* @param {Why_IncludedInputs} inputs
* @param {{ locale?: "en" | "zh" }} options
* @returns {LocalizedString}
*/
export const why_included = /** @type {((inputs: Why_IncludedInputs, options?: { locale?: "en" | "zh" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Why_IncludedInputs, { locale?: "en" | "zh" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "zh") return __zh.why_included(inputs)
	return __en.why_included(inputs)
});