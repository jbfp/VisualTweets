using System.Linq;
using System.Web.Mvc;
using Chromesthesia.ViewModels.Twitter;
using LinqToTwitter;

namespace Chromesthesia.Controllers
{
    [RequireHttps]
    public class TwitterController : Controller
    {
        [HttpGet]
        [Route("{query?}")]
        [Route("~/{query?}", Name = "Default")]        
        public ActionResult Index(string query)
        {
            var authorizer = new MvcAuthorizer {Credentials = new SessionStateCredentials()};

            if (!authorizer.IsAuthorized)
            {
                return RedirectToAction("BeginAuthorization", "OAuth", new {query});
            }

            var viewModel = new IndexViewModel {Query = query};
            return View(viewModel);
        }

        [HttpGet]
        [Route("Tweets/{query}")]
        public ActionResult Tweets(string query)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return HttpNotFound();
            }

            var authorizer = new MvcAuthorizer {Credentials = new SessionStateCredentials()};

            if (!authorizer.IsAuthorized)
            {
                return RedirectToAction("BeginAuthorization", "OAuth", new {query});
            }

            var ctx = new TwitterContext(authorizer);
            var searchResponse = (from search in ctx.Search
                                  where search.Type == SearchType.Search
                                  where search.Query == query
                                  where search.Count == 50
                                  where search.SearchLanguage == "en"                                                                
                                  where search.ResultType == ResultType.Mixed
                                  select search).Single();

            return new JsonNetResult {Data = searchResponse.Statuses, JsonRequestBehavior = JsonRequestBehavior.AllowGet};
        }
	}
}