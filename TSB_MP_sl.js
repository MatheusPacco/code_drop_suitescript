/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 */

define([
   'N/search', 
   'N/ui/serverWidget', 
   'N/http'
],

   function (
      search, 
      serverWidget,
      http
   ) {

      /**
       * Definition of the Suitelet script trigger point.
       *
       * @param {Object} context
       * @param {ServerRequest} context.request - Encapsulation of the incoming request
       * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
       * @Since 2015.2
       */
      function onRequest(context) {

         if (context.request.method == 'GET') {

            runGet(context);

         } else if (context.request.method == 'POST') {

            const contextUrlParams = context.request.parameters
            const objParams = capParams(contextUrlParams); 

            // Validando os valores dos campos capturados pelo método de parâmetros; 

            const typeFilter = validateFields(objParams); 

            log.debug({title: "Filtro", details: typeFilter}); 

            const arrayInvoice = []; 

            const pesquisaPorData = search.create({
               type: 'invoice', 
               filters: [
                  ...typeFilter, 
                  {
                     name: 'mainline', 
                     operator: search.Operator.IS, 
                     values: 'T'
                  }
               ],  
               columns: 
               [  
                  'tranid', 
                  'custbody_rey_customer_cnpj', 
                  'trandate', 
                  'duedate', 
                  'startdate', 
                  'enddate', 
                  'custbody_rep_valor_coge', 
                  'memo', 
                  'entity', 
                  'subsidiary'
               ]  
            }).run().each(invoice => {
               let objInvoice = {}

               objInvoice.tranid = invoice.getValue({name: 'tranid'});
               objInvoice.cnpj = invoice.getValue({name: 'custbody_rey_customer_cnpj'}); 
               objInvoice.dtCricao = invoice.getValue({name: 'trandate'}); 
               objInvoice.dtVencimento = invoice.getValue({name: 'duedate'}); 
               objInvoice.dtInicial = invoice.getValue({name: 'startdate'}); 
               objInvoice.dtFinal = invoice.getValue({name: 'enddate'}); 
               objInvoice.valor = invoice.getValue({name: 'custbody_rep_valor_coge'});
               objInvoice.memo = invoice.getValue({name: 'memo'});
               objInvoice.cliente = invoice.getValue({name: 'entity'});
               objInvoice.subsidiria = invoice.getValue({name: 'subsidiary'});

               arrayInvoice.push(objInvoice);

               log.debug({title: "Datas", details: objInvoice.dtInicial}); 
               log.debug(objInvoice.dtFinal); 


               objInvoice.memo == '' ? objInvoice.memo = " " : null; 

               return true
            }); ; 

            gerateFormPost(context, arrayInvoice);
         }

      };

      function runGet(context) {
         gerateFormGet(context); 
      };

      function gerateFormGet(context){
         const form = serverWidget.createForm({title: 'Invoice Filter'});
         context.response.writePage(form)

         let fieldgroup = form.addFieldGroup({
            id: 'custpage_fieldgroupid',
            label: 'Filter Field'
         });

         let fieldInvoice = form.addField({
            id: 'custpage_invoice',
            type: serverWidget.FieldType.INTEGER,
            label: 'Invoice',
            container: 'custpage_fieldgroupid'
         });
         
         let fieldDtCriacao = form.addField({
            id: 'custpage_dtcriacao',
            type: serverWidget.FieldType.DATE,
            label: 'Data de Criação',
            container: 'custpage_fieldgroupid'
         });

         let fieldDtInicial = form.addField({
            id: 'custpage_dtinicial',
            type: serverWidget.FieldType.DATE,
            label: 'Data Inicial',
            container: 'custpage_fieldgroupid'
         });

         let fieldDtFinal = form.addField({
            id: 'custpage_dtfinal',
            type: serverWidget.FieldType.DATE,
            label: 'Data Final',
            container: 'custpage_fieldgroupid'
         });

         let fieldDtVencimento = form.addField({
            id: 'custpage_dtvencimento',
            type: serverWidget.FieldType.DATE,
            label: 'Data de Vencimento',
            container: 'custpage_fieldgroupid'
         }); 

         let fieldValorMinimo = form.addField({
            id: 'custpage_valormin',
            type: serverWidget.FieldType.FLOAT,
            label: 'Valor Minímo',
            container: 'custpage_fieldgroupid'
         }); 

         let fieldValorMaximo = form.addField({
            id: 'custpage_valormax',
            type: serverWidget.FieldType.FLOAT,
            label: 'Valor Máximo',
            container: 'custpage_fieldgroupid'
         }); 

         form.clientScriptModulePath = './TSB_MP_Suitelet_cs.js'

         form.addSubmitButton({
            label: "Aplicar Filtro"
         }); 
      }

      ////////////////////////////////////////////////////////// POST ////////////////////////////////////////////////////////// 

      function gerateFormPost(context, arrayInvoice){
         var form = serverWidget.createForm({
            title: "Resultado da Pesquisa"
         }); 

         var sublist = form.addSublist({
            id: 'custpage_sublist_post', 
            type: serverWidget.SublistType.INLINEEDITOR, 
            label: 'Sublista de resultado'
         })

         sublist.addField({
            id: 'custpage_sublist_invoice', 
            type: serverWidget.FieldType.INTEGER,
            label: 'Invoice'
         })

         sublist.addField({
            id: 'custpage_sbl_dtcriacao',
            type: serverWidget.FieldType.DATE,
            label: 'Data Criação'
         });

         sublist.addField({
            id: 'custpage_sbl_memo',
            type: serverWidget.FieldType.TEXT,
            label: 'Memo'
         });

         sublist.addField({
            id: 'custpage_sbl_cliente',
            type: serverWidget.FieldType.SELECT,
            label: 'Cliente', 
            source: 'customer'
         });

         sublist.addField({
            id: 'custpage_sbl_subsidiaria',
            type: serverWidget.FieldType.SELECT,
            label: 'Subsidiária', 
            source: 'subsidiary'
         });

         sublist.addField({
            id: 'custpage_sbl_dtinicial',
            type: serverWidget.FieldType.DATE,
            label: 'Data Inicial'
         });

         sublist.addField({
            id: 'custpage_sbl_dtfinal',
            type: serverWidget.FieldType.DATE,
            label: 'Data Final'
         });

         sublist.addField({
            id: 'custpage_sbl_dtvencimento',
            type: serverWidget.FieldType.DATE,
            label: 'Data Vencimento'
         });

         sublist.addField({
            id: 'custpage_sbl_valor',
            type: serverWidget.FieldType.FLOAT,
            label: 'Valor'
         });

         ////////////////////////////////////////// Atribuindo Valores ////////////////////////////////

         let count = 0  

         arrayInvoice.map((invoice) => {
            sublist.setSublistValue({
               id: 'custpage_sublist_invoice',
               value: invoice.tranid,
               line: count 
            });
   
            if (invoice.memo.length >= 300) {
               invoice.memo = "Passou do Limite";  
            }

            sublist.setSublistValue({
               id: 'custpage_sbl_memo',
               value: invoice.memo,
               line: count 
            });
   
            sublist.setSublistValue({
               id: 'custpage_sbl_cliente',
               value: invoice.cliente,
               line: count 
            });

            sublist.setSublistValue({
               id: 'custpage_sbl_subsidiaria',
               value: invoice.subsidiria,
               line: count 
            });
   
            sublist.setSublistValue({
               id: 'custpage_sbl_dtcriacao',
               value: invoice.dtCricao, 
               line: count 
            });
               
            if(invoice.dtVencimento != ''){

               sublist.setSublistValue({
                  id: 'custpage_sbl_dtvencimento',
                  value: invoice.dtVencimento, 
                  line: count, 
               });

            }

            if(invoice.dtInicial != ''){

               sublist.setSublistValue({
                  id: 'custpage_sbl_dtinicial',
                  value: invoice.dtInicial, 
                  line: count, 
               });

            }

            if(invoice.dtFinal != ''){

               sublist.setSublistValue({
                  id: 'custpage_sbl_dtfinal',
                  value: invoice.dtFinal, 
                  line: count, 
               });

            }
          
            sublist.setSublistValue({
               id: 'custpage_sbl_valor',
               value: invoice.valor, 
               line: count 
            });
            
            count++ 
         }); 
         
         context.response.writePage(form)
      }

      function capParams(contextUrlParams){
         let objParams = {};

         // const ArrayParams = JSON.stringify(contextUrlParams);  

         //    ArrayParams.map(params =>{
         //       log.debug(params);
         //    })

         objParams.invoice = {
            name: 'tranid', 
            operator: search.Operator.IS,
            values: contextUrlParams['custpage_invoice']
         };

         objParams.dtCriacao = {
            name: 'trandate', 
            operator: search.Operator.ON,
            values: contextUrlParams['custpage_dtcriacao']
         }; 

         objParams.dtInicial = {
            name: 'startdate', 
            operator: search.Operator.AFTER,
            values:  contextUrlParams['custpage_dtinicial']
         }; 

         objParams.dtFinal = {
            name: 'enddate', 
            operator: search.Operator.BEFORE,
            values: contextUrlParams['custpage_dtfinal']
         }; 

         objParams.dtVencimento = {
            name: 'duedate', 
            operator: search.Operator.ON,
            values: contextUrlParams['custpage_dtvencimento']
         }; 

         objParams.valorMinAndMax = {
            name: 'custbody_rep_valor_coge', 
            operator: search.Operator.BETWEEN,
            values: [[contextUrlParams['custpage_valormin']],[contextUrlParams['custpage_valormax']]] 
         }; 

         return objParams; 
      }; 
      
      function validateFields(objParams){

         let arrayTypeFilter = []; 

         for (const propriedade in objParams) {
            let valor = objParams[propriedade].values; 

            if(valor != '' && valor != ','){
               arrayTypeFilter.push(objParams[propriedade]); 
            }

            log.debug({title: "ArrayDe Fltro?", details: arrayTypeFilter}); 
         }

         return arrayTypeFilter; 
      }; 

      return {
         onRequest: onRequest
      };

   });